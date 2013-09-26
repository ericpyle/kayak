/**
 * @author Pyle
 */

			/*
			dbMain.get('all', 
      			function(resp) {
      				getResponse = resp;
      				exampleRows = getResponse.rows;
		        	// TODO: normalize '_id' vs 'id'
		        	//alert("get: records" + resp.rows.length); // +  ", hello:" + resp.hello);		        	
		      	});

			db.put('sample-record', { hello: 'world' }, 
				function(resp) {
					putResponse = resp;
	        		// TODO: normalize '_id' vs 'id'
	        		alert("put: " + resp._id);
      			});
      		db.get('sample-record', 
      			function(resp) {
      				getResponse = resp;
		        	// TODO: normalize '_id' vs 'id'
		        	alert("get: " + resp._id +  ", hello:" + resp.hello);		        	
		      	});
		      	*/

		var putResponse;
		var dbMain;
		function LoadPersonsAndAuthoredOutlines()
		{
			var getResponse = getDb();
			var fNeedRenderToPage = true;
			if (getResponse)
			{
				LoadExamplesToTableCallback(getResponse.rows);				
	      		//LoadAuthorResultsCallback(getResponse);
	      		fNeedRenderToPage = false;
			}
			
			loadDataSet(fNeedRenderToPage);
		}
		
		function loadDataSet(fNeedRenderToPage, doSomethingAfterLoad)
		{
			var getResponse = null;
			if (dbMain)
			{
				//_design/personProfiles/_view/personsAndOutlinesAuthored
				try
				{
					dbMain.get('_design/everything/_view/byDocId', 
		      			function(resp) {
		      				if (resp)
		      				{
			      				cacheDbInDom(resp);
			      				getResponse = resp;			      				
			      				//$("body").data("personsAndOutlinesAuthored", getResponse);
			      				
			      				if (fNeedRenderToPage)
			      				{
				      				LoadExamplesToTableCallback(getResponse.rows);
				      				InitializeAfterDbSetup();
			      					//LoadAuthorResultsCallback(getResponse);	
			      				}
			      				if (doSomethingAfterLoad)
			      					doSomethingAfterLoad();			      				
			      			}
			      			else
			      			{			      				
			      				alert("error: " + JSON.stringify(resp));
			      			}
			      			
				      	});	
				}
				catch(err)
				{
					alert("error loading database." + JSON.stringify(err));
				}

			}
			else
			//if (!getResponse)
			{	
				getResponse = getDb(true);				
				if (fNeedRenderToPage)
				{					
					LoadExamplesToTableCallback(getResponse.rows);
	      			//LoadAuthorResultsCallback(getResponse);
				}
				if (doSomethingAfterLoad)
  					doSomethingAfterLoad();
			}
		}
		
		function cacheDbInDom(resp)
		{
			$("body").data("getResponse", resp);
			return resp;	
		}
		
		function getDb(fLoadFakeCacheIfMissing)
		{
			var getResponse = $("body").data("getResponse");
			if (fLoadFakeCacheIfMissing && getResponse == null)
			{
				getResponse = cacheDbInDom(authorsAndOutlinesResponse);
				alert("Couldn't download tables from internet. Try refreshing your page. Otherwise your changes will not be saved.");
			}
			return getResponse;
		}
		
		function getDbRows()
		{
			return getDb().rows;
		}

		function getUserFriendlyContentType(contentType) {
		    if (contentType == "outline")
		        return "hierarchical";
		    return contentType;
		}
		
		function LoadExamplesToTableCallback(exampleRows)
		{
			var dataTable1 = $("#exampleTable").data("dataTable");
			dataTable1.fnClearTable(false);
			for (var i=0; i < exampleRows.length; ++i) {
				var doc = exampleRows[i].value;
				if (!doc || (doc.head.contentType != "chiasm" && doc.head.contentType != "outline" && doc.head.contentType != "panel"))
					continue;
				var authorProfile = collectProfileDocs("personProfile", exampleRows, function(rowDoc){
							if (rowDoc.head.contentType == "personProfile" && 
			    				doc.head.author && rowDoc._id == doc.head.author.guid )
						    		return true;
						    	return false;
						}, true );
  				var submitterProfile = collectProfileDocs("personProfile", exampleRows, function(rowDoc){
							if (rowDoc.head.contentType == "personProfile" && 
			    				doc.head.submittedBy && rowDoc._id == doc.head.submittedBy.guid )
						    		return true;
						    	return false;
						}, true );
				
  				var dataTable1 = $("#exampleTable").data("dataTable");
  				var contentType = getUserFriendlyContentType(doc.head.contentType);
				var iSettings = dataTable1.fnAddData(
					[	
						formatScriptureRange(doc.head.ScriptureRange, "") + "<br/>" + "<i>" + contentType + "</i>",
						doc.head.title,
						formatName(authorProfile, ""), 
						formatSource(doc, ""), 
						formatSubmissionTimestamp(doc.head.submissionTimestamp), 
						formatName(submitterProfile, "")],
						false /* don't redraw */
				);
				var drow = dataTable1.fnSettings().aoData[iSettings[0]];
				$(drow.nTr)
					.addClass("exampleRow")
					.attr("id", exampleRows[i].id)
					.click(function(event) 
					{
						selectOutlineRow($(this)); 
		  				return false;
					});
				dataTable1.fnDraw();
			};			
		}
		
		function fetchOutline(rowId)
		{
			var exampleRows = getDbRows();
			for(var irow=0; irow<exampleRows.length; ++irow)
			{
				if (exampleRows[irow].id == rowId)
				{
					return exampleRows[irow].value;
				}
			}
			return null;
		}
		
		function selectOutlineRow(outlineRow)
		{
			if (!outlineRow)
				return false;
			var rowId = $(outlineRow).attr("id");
			var hadSelection = $(outlineRow).hasClass("outlineRowSelected");
			removeOutlineRowSelection(outlineRow);
			var docToLoad; 
			if (!hadSelection)
			{
				// load the selected outline
				$(outlineRow).addClass("outlineRowSelected");
				//alert(rowId);									
				docToLoad = fetchOutline(rowId);
			} 
			else
			{
				// load a blank outline
				docToLoad = createBlankOutline("chiasm");
			}
			
			if ($(outlineRow).hasClass("outlineRowSelected"))
				installOutlineRowOptions(outlineRow);
			
			if (docToLoad)
				loadJSONToOutline(docToLoad);
		}
		
		function installOutlineRowOptions(outlineRow)
		{
			if (!outlineRow)
				return false;
			if ($("#outlineSelectedOptions").length > 0)
				return false;	// already installed
			var editText = "Edit";
			var rowHtml = "";
			var editLink = '<a href="#" id="btnJumpToEditTab">Edit</a>';
			var citeLink = '<a href="#" id="btnJumpToCiteTab">Cite</a>';
			rowHtml = '<tr id="outlineSelectedOptions" class="selectedRowOptions"><td colspan="6"><button id="btnJumpToViewTab" type="button">View</button> ' 
				+ editLink + " | " + citeLink  + '</td></tr>';
			// add some extra options
			$(outlineRow).after(rowHtml);
			$("#btnJumpToViewTab").click(function(event){
				$("#tabsMain").tabs("option", "active", getTabIndex("#View"));
				return false;
			});
			$("#btnJumpToEditTab").click(function(event){
				$("#tabsMain").tabs("option", "active", getTabIndex("#EditView"));
				return false;
			});
			$("#btnJumpToCiteTab").click(function(event){
				$("#tabsMain").tabs("option", "active", getTabIndex("#Cite"));
				return false;
			});
		}
		
		function formatBCVRange(range, sdefault)
		{
			if (!range || range.length == 0)
				return sdefault;
			return range[0] + " " + range[1] + 
				(range.length > 2 ? ":" + range[2] : "") +
				(range.length > 4 ? "-" + (range[3] != range[0] ? range[3] + " " : "") + range[4]: "") +
				(range.length > 5 ? ":" + range[5]: ""); 
		}
		
		function formatScriptureRange(range, sdefault)
		{
			return range;
		}
		
		function formatSource(outline, sdefault)
		{
			var sourceProfile = fetchSourceProfile(outline._id + "_source");
			return formatCombinedSource(sourceProfile, sdefault);
		}
		
		/*
		 * Formats a structure holding information about common source info and outline specific info
		 */
		function formatCombinedSource(profile, sdefault)
		{
			if (!profile)
				return sdefault;
			
			/*
			"_id" : "",
			"outline" : 
			{
				"_id" : "",
				"source" : 
				{
					"details" : "",
					"website" : ""
				}
			},
			"source" : 
			{
				"_id" : "",
				"media" : "",
				"details" : "",
				"website" : "",
				"publisherDetails" : ""
			}
			*/
			var commonSource = EmptyIfNull(profile.source.details);			
			var specificSource = 
				profile.outline && profile.outline.source && profile.outline.source.details ? 
					EmptyIfNull(profile.outline.source.details) : "";
			var source = commonSource.length > 0 ? commonSource + (specificSource.length > 0 ? ", " + specificSource : "") : specificSource;
			if (source.length == 0)
				return sdefault;
			else
				return source;
		}
		
		function formatName(personProfile, sdefault, fNameOnly)
		{
			if (!personProfile)
				return sdefault;
			var title = AorB(personProfile.name.title, "");
			var first = AorB(personProfile.name.first, "");
			var middle = AorB(personProfile.name.middle, "");
			var last = AorB(personProfile.name.last, "");
			var first2 = (first.length > 0 ? ((title.length > 0 ? " " : "") + first) : "");
			var middle2 = (middle.length > 0 ? ((first2.length > 0 ? " " : "") + middle) : "");
			var combined1 = title + first2 + middle2; 
			var last2 = (last.length > 0 ? ((combined1.length > 0 ? " " : "") + last) : "");
			return title + first2 + middle2 + last2 +
				(!fNameOnly && personProfile.organization && personProfile.organization.name ? ", " + personProfile.organization.name : "");
		}
		
		function formatSubmissionTimestamp(timestamp)
		{
			if (!timestamp)
			    return "";
			var timeArray = timestamp[3].split(':');
			var dateTime = new Date(timestamp[0], timestamp[1], timestamp[2], timeArray[0], timeArray[1]);
			var timeAMPM = formatAMPM(dateTime);
			return timestamp[1] + "/" + timestamp[2] + "/" + timestamp[0] + " " + timeAMPM;
		}
		
		var authorColumns = function(doc, key)
		{
			if (!doc || !key)
				return "";
				
			if (doc.name)
			switch (key)
			{
				case "name.title":
					return EmptyIfNull(doc.name.title);
				case "name.first":
					return EmptyIfNull(doc.name.first);
				case "name.middle":
					return EmptyIfNull(doc.name.middle);
				case "name.last":
					return EmptyIfNull(doc.name.last);
				case "name.suffix":
					return EmptyIfNull(doc.name.suffix);
			}

			if (doc.organization)
			switch (key)
			{
				case "organization.name":
					return EmptyIfNull(doc.organization.name);
				case "organization.website":
					return EmptyIfNull(doc.organization.website);
			}
			return "";		
		}
		
		function LoadAuthorResults()
		{
			var fNeedRenderToPage = true;
			if (getResponse)
			{				
	      		LoadAuthorResultsCallback(getDbRows());
	      		fNeedRenderToPage = false;
			}
			
			loadDataSet(fNeedRenderToPage);
		}
		
		/*
		 * return the fields and keywords matched.
		 */
		function QueryByAuthorMatches(personProfile, keywords)
		{
			var matches = {};
			if (!personProfile || personProfile.head.contentType != "personProfile")
				return matches;
			for (i in keywords)
			{
				var keyword = keywords[i];
				// skip whitespace
				if (keyword.length == 0)
					continue;
				lookupAuthorKeyword(personProfile, "name.title", matches, keyword);
				lookupAuthorKeyword(personProfile, "name.first", matches, keyword);
				lookupAuthorKeyword(personProfile, "name.middle", matches, keyword);
				lookupAuthorKeyword(personProfile, "name.last", matches, keyword);
				lookupAuthorKeyword(personProfile, "name.suffix", matches, keyword);
				lookupAuthorKeyword(personProfile, "organization.name", matches, keyword);
				lookupAuthorKeyword(personProfile, "organization.website", matches, keyword);				
			}
			return matches;
		}
		
		function lookupAuthorKeyword(personProfile, key, matches, keyword)
		{
			if (authorColumns(personProfile, key).toLowerCase().indexOf(keyword.toLowerCase()) != -1)
			{
					if (!matches[key])
						matches[key] = [keyword];
					else
						matches[key].push(keyword);
			}
		}
		
		function LoadNewProfileForm()
		{
			var editMode = $("#save-outline-credits").data("edit-mode");
			if (editMode == "save-outline-submitter")
			{
				LoadNewSubmitterForm();
			}
			else if (editMode == "save-outline-author")
			{
				LoadNewAuthorForm();
			}
			else if (editMode == "save-outline-source")
			{
				$("#sourceSearchResults").hide();
				$("#sourceHeading").text("Enter Source Details");				
				var emptyProfile = CreateEmptySourceFormData();
				var sourceEditMode = $("#sourceDetailBlock").data("edit-mode");
				if (sourceEditMode == "editCommon")
				{
					$("#sourceOutlineDetails").hide();
				}
				else
				{
					$("#sourceOutlineDetails").show();
				}

				$("[name='updateSourceDetails']").populate(emptyProfile);
				$("#sourceDetailBlock").attr("style", "background: #white;");	
			}

		}
		
		function LoadNewAuthorForm()
		{	
			$("#authorResults").hide();
			$("#authorHeading").text("Enter Author Details");
			$("#personDetailBlock").attr("style", "background: #B9C9FE;");
		}
		
		function PrepareNewAuthorSearchResults()
		{
			var dataTable1 = $("#authorResults").data("dataTable");
			dataTable1.fnClearTable(true);
			SwitchToAuthorProfileSearchResults();
		}
		
		function SwitchToAuthorProfileSearchResults()
		{
			ClearSubmitterResults();
			ClearSourceResults();
			
			$("#authorResults").show();
			$("#authorHeading").text("Search Results");
		}
		
		function ClearSubmitterResults()
		{
			$("#submitterProfileResults").hide();
			var dataTable1 = $("#submitterProfileResults").data("dataTable");
			dataTable1.fnClearTable(true);
			$("#personDetailBlock").hide();
		}
		
		function LoadNewSubmitterForm()
		{
			$("#submitterProfileResults").hide();
			$("#submitterHeading").text("Enter Submitter Details");
			$("#personDetailBlock").attr("style", "background: #B9C9FE;");
		}
		
		function PrepareNewSubmitterSearchResults()
		{
			var dataTable1 = $("#submitterProfileResults").data("dataTable");
			dataTable1.fnClearTable(true);
			SwitchToSubmitterProfileSearchResults();
		}
		
		function SwitchToSubmitterProfileSearchResults()
		{
			ClearAuthorResults();
			ClearSourceResults();
			
			$("#submitterProfileResults").show();
			$("#submitterHeading").text("Search Results");
		}
		
		function ClearAuthorResults()
		{
			$("#personDetailBlock").hide();
			$("#authorResults").hide();
			var dataTable1 = $("#authorResults").data("dataTable");
			dataTable1.fnClearTable(true);
		}
		
		function PrepareNewSourceSearchResults()
		{
			var dataTable1 = $("#sourceSearchResults").data("dataTable");
			dataTable1.fnClearTable(true);
			SwitchToSourceProfileSearchResults();
		}
		
		function SwitchToSourceProfileSearchResults()
		{
			ClearAuthorResults();
			ClearSubmitterResults();
			$("#sourceDetailBlock").hide();
			$("#sourceSearchResults").show();
			$("#sourceHeading").text("Search Results");
		}
		
		function ClearSourceResults()
		{
			$("#sourceDetailBlock").hide();
			$(".sourceSearchResults").hide();
			var dataTable1 = $("#sourceSearchResults").data("dataTable");
			dataTable1.fnClearTable(true);
		}
		
		/*
		 * Use this instead of Object.keys().length == 0, since that isn't 
		 * compatible with Opera or Blackbery browser.
		 */
		function hasKeys(obj) {
			if (!obj)
				return false;
		
		    for(var prop in obj) {
		        // hasOwnProperty check is important because 
		        // we don't want to count properties on the prototype chain
		        // such as "get", "put", "size", or others.
		        if(obj.hasOwnProperty(prop)) {
		            return true;
		        }
		    }
		
		    return false;
		};
		
		function matchByNewAuthorFormFields(doc)
		{
			var personProfile = $("[name='updatePersonProfile']").getJSON();
			if (doc.name.first ==  personProfile.name.first && 
				doc.name.last == personProfile.name.last &&
				EmptyIfNull(doc.name.middle) == personProfile.name.middle &&
				EmptyIfNull(doc.name.suffix) ==  personProfile.name.suffix &&
				(!doc.name.title ? personProfile.name.title == "(Title)" :  personProfile.name.title ) &&
				(!doc.organization ? personProfile.organization.name.length == 0 && personProfile.organization.website.length == 0 :
					(EmptyIfNull(doc.organization.name) == personProfile.organization.name &&
					EmptyIfNull(doc.organization.website) == personProfile.organization.website)))				
			{
				return true;	
			}
			return false;
		}
		
		function removeMalformedWords(list)
		{
			var wellformed = [];
			for (var i=0; i < list.length; i++) {
			  var word = list[i];
			  if (word.length == 0 || word.search(/[a-zA-Z]/) == -1)
			  	continue;
			  wellformed.push(word);
			};
			return wellformed;
		}
		
		function matchByAuthorKeywords(doc)
		{
			//var keywords = removeMalformedWords($("#authorResults_filter input").val().split(" "));
			return matchByKeywords(doc, null, QueryByAuthorMatches);
		}
		
		function matchBySubmitterKeywords(doc)
		{
			//var keywords = removeMalformedWords($("#submitterProfileResults_filter input").val().split(" "));
			return matchByKeywords(doc, null, QueryByAuthorMatches);
		}
		
		function matchBySourceKeywords(doc)
		{
			//var keywords = removeMalformedWords($("#sourceSearchResults_filter input").val().split(" "));
			return matchByKeywords(doc, null, QueryByAuthorMatches);
		}
		
		function matchByKeywords(doc, keywords, query)
		{
			if (keywords && keywords.length > 0)
			{
				var matches = query(doc, keywords);
				if (!hasKeys(matches))
					return false;
			}
			return true;
		}
		
		function collectProfileDocs(matchContentType, authorRows, matchesCondition, fFindFirstOnly)
		{
			var profileDocs = [];
			for (var i=0; i < authorRows.length; ++i) {
				var doc = authorRows[i].value;
				if (doc && doc.head.contentType == matchContentType)
				{
					if (!matchesCondition(doc))
						continue;
					if (fFindFirstOnly)
						return doc;
					profileDocs.push(doc);
				}
			}
			if (fFindFirstOnly)
				return null;
			return profileDocs;
		}

		function DocsAuthored(personProfile, authorRows)
		{
			var authoredDocs = [];
			for (var i=0; i < authorRows.length; i++) {
				var doc = authorRows[i].value;
				if (doc && doc._id != personProfile._id)
					continue;
				// now get the docs authored by this person.
				var countAuthored = 0;
				for (var inext=0; inext < authorRows.length; inext++) {					
					var nextDoc = authorRows[inext].value;
					if (nextDoc && (nextDoc.head.contentType == "chiasm" || nextDoc.head.contentType == "outline" || nextDoc.head.contentType == "panel" ) && 
						nextDoc.head.author && nextDoc.head.author.guid == personProfile._id)
						authoredDocs.push(nextDoc);
					else
						continue;
				};
			};
			return authoredDocs;
		}
		
		function DocsSubmitted(personProfile, authorRows)
		{
			var submittedDocs = [];
			for (var i=0; i < authorRows.length; i++) {
				var doc = authorRows[i].value;
				if (doc && doc.head && doc.head.submittedBy && 
					doc.head.submittedBy.guid == personProfile._id)
				{
					submittedDocs.push(doc);							
				}
			};
			return submittedDocs;
		}
		
		function LoadAuthorResultsCallback(authorRows, fSubmitter)
		{
			//alert("loadAuthorResultsCallback");
			// first clear current results
			if (fSubmitter)
			{
				PrepareNewSubmitterSearchResults();
			}
			else
			{
				PrepareNewAuthorSearchResults();
			}
			var peopleDocs = [];
			try {
			 	peopleDocs = collectProfileDocs("personProfile", authorRows, 
			 		fSubmitter ? matchBySubmitterKeywords : matchByAuthorKeywords);
			}
			catch (err)
			{
				alert("caught error ("+ err.name +"): " + err.message);
			}
			
			//alert(peopleDocs.length);
			peopleDocs.sort(sortByFirstName);
			for (var idoc=0; idoc < peopleDocs.length; ++idoc)
			{
				var profile = peopleDocs[idoc];
				
				var dataTable1 = $(fSubmitter ? "#submitterProfileResults" : "#authorResults").data("dataTable");
				var iSettings = dataTable1.fnAddData(
					[	authorColumns(profile, "name.title"), 
						authorColumns(profile, "name.first"), 
						authorColumns(profile, "name.middle"), 
						authorColumns(profile, "name.last"), 
						authorColumns(profile, "name.suffix"), 
						authorColumns(profile, "organization.name") + "<br/>" + authorColumns(profile, "organization.website"),
						fSubmitter ? DocsSubmitted(profile, authorRows).length : DocsAuthored(profile, authorRows).length],
						false /* don't redraw */
				);
				var drow = dataTable1.fnSettings().aoData[iSettings[0]];
				$(drow.nTr)
					.attr("id", profile._id)
					.addClass("creditRow")
					.click(function(event) {
						// first turn off any other selected Row.
						var parentRow = $(event.target).parent("tr");
						selectCreditRow(parentRow);
		  				return false;
					});
				
				// Add some special markup
				var cells = $(drow.nTr).children("td");
				var cellOrg = $(cells)[5];
				var txtCell = $(cellOrg).html();
				$((cells)[0]).addClass("personName");
				$((cells)[1]).addClass("personName");
				$((cells)[2]).addClass("personName");
				$((cells)[3]).addClass("personName");
				$((cells)[4]).addClass("personName");
				dataTable1.fnDraw();
			}
		};
		
		function fetchPersonProfile(idProfile)
		{
			var authorProfile = collectProfileDocs("personProfile", getDbRows(), function(rowDoc){
				if (rowDoc._id == idProfile)
			    		return true;
			    	return false;
			}, true );
			return authorProfile;
		}
		
		function fetchSourceProfile(idProfile)
		{
		    var guid = "";
		    var sourceguid = "";
		    var outlineSourceDetails = "";
		    var components = idProfile.split("_");
		    if (components.length == 2)
		        guid = components[0];
		    else if (components.length == 3) {
		        sourceguid = components[0];
		        outlineSourceDetails = unescape(components[1]);
		    }
			var exampleRows = getDbRows();
			for (var i=0; i < exampleRows.length; ++i) {
				var doc = exampleRows[i].value;
				if (!doc)
				    continue;
				if (sourceguid == "" && doc._id != guid)
					continue;
				if (doc.head.contentType == "chiasm" || doc.head.contentType == "outline" || doc.head.contentType == "panel")
				{
				    if (sourceguid != ""){
				        if (doc.head.source && doc.head.source.guid == sourceguid && doc.head.source.details == outlineSourceDetails)
				            guid = doc._id;
				        else
				            continue;
				    }
					//alert(JSON.stringify(doc));
					// create a profile
					var sourceFormFields = CreateEmptySourceFormData();
					sourceFormFields._id = guid;
					sourceFormFields.outline._id = guid;
					if (doc.head.source){
						sourceFormFields.outline.source.details = EmptyIfNull(doc.head.source.details);					
						sourceFormFields.outline.source.website = EmptyIfNull(doc.head.source.website);
					}
					// get source profile
					var commonSourceProfile = getCommonSourceProfile(doc, exampleRows);
					fillCommonSourceData(sourceFormFields, commonSourceProfile);
					//if (doc.head.source)
					//	alert(doc.head.source.guid + JSON.stringify(sourceFormFields));
					return sourceFormFields;
				}
				if (doc.head.contentType == "sourceProfile")
				{
				    if (sourceguid != "")
				        continue;
					//alert(JSON.stringify(doc));
					// create a profile
					var sourceFormFields = CreateEmptySourceFormData();
					sourceFormFields._id = guid;
					// get source profile
					fillCommonSourceData(sourceFormFields, doc);
					//if (doc.head.source)
					//	alert(doc.head.source.guid + JSON.stringify(sourceFormFields));
					return sourceFormFields;					
				}
			}
			return null;
		}
		
		function fillCommonSourceData(sourceFormFields, commonSourceProfile)
		{
			if (commonSourceProfile)
			{
				sourceFormFields.source._id = commonSourceProfile._id;
				sourceFormFields.source.media = EmptyIfNull(commonSourceProfile.media);
				sourceFormFields.source.details = EmptyIfNull(commonSourceProfile.details);
				sourceFormFields.source.website = EmptyIfNull(commonSourceProfile.website);
				sourceFormFields.source.publisherDetails = EmptyIfNull(commonSourceProfile.publisherDetails);
			}
			return sourceFormFields;
		}
		
		function CreateEmptySourceFormData()
		{
			return { 
						"_id" : "",
						"outline" : 
						{
							"_id" : "",
							"source" : 
							{
								"details" : "",
								"website" : ""
							}
						},
						"source" : 
						{
							"_id" : "",
							"media" : "",
							"details" : "",
							"website" : "",
							"publisherDetails" : ""
						}
				};
		}
		
		function removeOutlineRowSelection(outlineRow)
		{
			removeRowSelectionAndOptions(outlineRow, "outlineRowSelected", "outlineSelectedOptions");
		}
		
		function removeAllCreditRowSelections(creditRow)
		{
			removeRowSelectionAndOptions(creditRow, "creditRowSelected", "creditRowSelectedOptions");
		}
		
		function removeRowSelectionAndOptions(row, classSelectedRow, idOptions)
		{
			$('tr.' + classSelectedRow).removeClass(classSelectedRow);
			var table = $(row).parent("tbody").parent("table"); // could be empty set
			removeAnyRowSelectionAndOptions(table, classSelectedRow, idOptions);
		}
		
		function removeAnyRowSelectionAndOptions(table, classSelectedRow, idOptions)
		{
			if (table == null || $(table)[0] == null || $(table)[0].tagName != "TABLE")
				return;
			var oTable = $(table).data("dataTable");
			if (!oTable)
				return;
			var selectedRow = oTable.$('tr.' + classSelectedRow);
			if (selectedRow)
				selectedRow.removeClass(classSelectedRow);
			// remove extra options
			$(jq(idOptions)).remove();
		}
		
		function installCreditRowOptions(creditRow)
		{
			if ($("#creditRowSelectedOptions").length > 0)
				return false; // already installed
			var editMode = $("#save-outline-credits").data("edit-mode");			
			var editModeText = "Edit Profile";
			var editModeId = "editProfile";
			var rowHtml = "";
			if (editMode == "save-outline-submitter" || editMode == "save-outline-author")
			{
				var editLink = '<a href="#" id="'+ editModeId +'">'+ editModeText +'</a>';
				rowHtml = '<tr id="creditRowSelectedOptions" class="selectedRowOptions"><td colspan="7"><button id="btnCreditOk" type="button">OK</button> ' + editLink + '</td></tr>';
				
			}
			else if (editMode == "save-outline-source")
			{
				var idProfile = $(".creditRowSelected").attr("id");
				var profile = fetchSourceProfile(idProfile);
				//alert(JSON.stringify(profile));
				editModeId = "editCommon";
				editModeText = "Edit Common";
				// need to restrict editing outline to specific outline
				if (profile._id == mainOutline._id || profile._id == "newOutlineStub")
				{
					editModeId = "editProfile";
					editModeText = "Edit Common + Specific";
				}
				var editLink = '<a href="#" id="'+ editModeId +'">'+ editModeText +'</a>';
				var copyLink = '<a id="copyToNewProfile" href="#">Copy to New</a>';
				if (idProfile == "kyk:1845-12-23T03:22:15.481Z:sr_source")
					rowHtml = '<tr id="creditRowSelectedOptions" class="selectedRowOptions"><td colspan="3"><button id="btnCreditOk" type="button">OK</button></td></tr>';
				else
					rowHtml = '<tr id="creditRowSelectedOptions" class="selectedRowOptions"><td colspan="3"><button id="btnCreditOk" type="button">OK</button> ' + editLink  + " | " + copyLink + '</td></tr>';						
			}
			// add some extra options
			$(creditRow).after(rowHtml);
			var fetchProfile;
			var formSelector;
			if (editMode == "save-outline-author" || editMode == "save-outline-submitter"){
				fetchProfile = fetchPersonProfile;
				formSelector = "[name='updatePersonProfile']";
			}
			if (editMode == "save-outline-source"){
				fetchProfile = fetchSourceProfile;
				formSelector = "[name='updateSourceDetails']";
			}
			$("#editProfile, #copyToNewProfile, #editCommon").click(function(event){
					// show search
					var idProfile = $(".creditRowSelected").attr("id");
					var editMode = event.target.id;
					loadEditForm(idProfile, fetchProfile, editMode, formSelector);
					return false;
				});

			$("#btnCreditOk").click(function(event){
				var idProfile = $(".creditRowSelected").attr("id");
				var profile = fetchProfile(idProfile);
				var editMode = $("#save-outline-credits").data("edit-mode");
				if (editMode == "save-outline-author"){
					stageSelectedAuthorProfile(profile);
					$("#authorSpecification").hide();
				}
				if (editMode == "save-outline-submitter"){
					stageSelectedSubmitterProfile(profile);
					$("#submitterSpecification").hide();
				}
				if (editMode == "save-outline-source"){
					stageSelectedSourceProfile(profile);
					$("#sourceSpecification").hide();
				}
				return false;
			});
		}
		
		function pageToRow(domTableSelector, datatableRowSelector)
		{
			var oTable = $(domTableSelector).data("dataTable");		
			var selectedRow = oTable.$(datatableRowSelector);
			if (TestNoResults(selectedRow))
				return;
			var indexOfSelectedRow = oTable.$('tr').index(selectedRow);
			var oSettings = oTable.fnSettings();
			var targetPage = Math.floor(indexOfSelectedRow/oSettings._iDisplayLength);
			oTable.fnPageChange(targetPage);
			return $(datatableRowSelector);
		}
		
		function TestNoResults(results)
		{
			return !results || results.length == 0;
		}
		
		function selectCreditRow(creditRow)
		{
			if (TestNoResults(creditRow))
				return false;
			var hadSelection = $(creditRow).hasClass("creditRowSelected");
			removeAllCreditRowSelections(creditRow);
			if (!hadSelection)
				$(creditRow).addClass("creditRowSelected");
			if ($(creditRow).hasClass("creditRowSelected"))
			{
				var editMode = $("#save-outline-credits").data("edit-mode");
				installCreditRowOptions(creditRow);				
			}
		}
		
		function loadEditForm(idProfile, fetchProfile, editMode, formSelector)
		{
			var profile = null;
			if (idProfile)
				profile = fetchProfile(idProfile);
			// TODO: change to "formSelector"
			$(formSelector).data("profile-original", profile);
			$(formSelector).data("edit-mode", editMode);
			//alert(idProfile);
			LoadNewProfileForm();
			if (profile){
				$(formSelector).populate(profile);
				$(formSelector).find("textarea").each( function(index) 
					{
						FitToContent(this,'','100');
					});
			}
		}
				
		function sortByLastName(a,b){
			var lastNameA = authorColumns(a, "name.last");
			var lastNameB = authorColumns(b, "name.last");
			if (lastNameA == lastNameB)
				return sortByFirstName(a,b); 
		    return lastNameA.toLowerCase() > lastNameB.toLowerCase() ? 1 : -1;  
		};
		
		function sortByFirstName(a,b){
			var nameA = authorColumns(a, "name.first");
			var nameB = authorColumns(b, "name.first");
			if (nameA == nameB)
			{
				if (authorColumns(a, "name.last") != authorColumns(b, "name.last"))
					return sortByLastName(a,b);
				else
					return 0;
			}
				
		    return nameA.toLowerCase() > nameB.toLowerCase() ? 1 : -1;  
		};
		
		function LoadSubmitterResults()
		{
			var fNeedRenderToPage = true;
			if (getResponse)
			{	
	      		LoadAuthorResultsCallback(getDbRows(), true);
	      		fNeedRenderToPage = false;
			}
			
			loadDataSet(fNeedRenderToPage);
		};
		
		function LoadSourceResults()
		{
			var fNeedRenderToPage = true;
			if (getResponse)
			{	
	      		LoadSourceResultsCallback(getDbRows());
	      		fNeedRenderToPage = false;
			}
			
			loadDataSet(fNeedRenderToPage);
		};
		
		function getCommonSourceProfile(doc, sourceRows)
		{
			var sourceDoc = collectProfileDocs("sourceProfile", sourceRows, 
		 		function(rowDoc){
					if (rowDoc.head.contentType == "sourceProfile" && 
						doc.head.source && rowDoc._id == doc.head.source.guid )
						{
							return true;
						}				    		
				    	return false;
				}, true );
			return sourceDoc;
		}
		
		function findOutlinesAndUnreferencedSources(rows)
		{
			var profiles = [];
			var sourceGuids = [];
			var sources = [];
			for (var i=0; i < rows.length; ++i) {
				var doc = rows[i].value;
				if (!doc)
					continue;
				if (doc.head.contentType == "chiasm" || 
					doc.head.contentType == "outline" || 
					doc.head.contentType == "panel" )
				{
					profiles.push(doc);
					if (doc.head.source && doc.head.source.guid)
					{
						sourceGuids[doc.head.source.guid] = true;	
					}
				}
				if (doc.head.contentType == "sourceProfile")
				{
					sources.push(doc);
				}
			}
			for (var isource=0; isource < sources.length; ++isource)
			{
				var source = sources[isource];
				if (!sourceGuids[source._id])
				{
					profiles.push(source);
				}
			}
			return profiles;			
		}
		
		function fetchAuthorProfileByOutline(outlineDoc)
		{
			var exampleRows = getDbRows();
			return collectProfileDocs("personProfile", exampleRows, function(rowDoc){
							if (rowDoc.head.contentType == "personProfile" && 
			    				outlineDoc.head.author && rowDoc._id == outlineDoc.head.author.guid)
						    		return true;
						    	return false;
						}, true );
		}
		
		function LoadSourceResultsCallback(exampleRows)
		{
			PrepareNewSourceSearchResults();
			// TODO: factor in the search keywords here
			// but for now just show all
		    // TODO: Add sort as well
			var combinedSourceProfiles = [];
			var profiles = findOutlinesAndUnreferencedSources(exampleRows);
			for (var i=0; i < profiles.length; ++i) {
			    var doc = profiles[i];
			    var sourceDetails = "";
			    if (doc.head.contentType == "chiasm" || doc.head.contentType == "outline" || doc.head.contentType == "panel")
			    {
			        sourceDetails = formatSource(doc, "");
			    }
			    if (doc.head.contentType == "sourceProfile")
			    {
			        // this is unreferenced source, so it doesn't have any associated outline details
			        var sourceFormFields = CreateEmptySourceFormData();
			        var combinedSource = fillCommonSourceData(sourceFormFields, doc);
			        sourceDetails = formatCombinedSource(combinedSource, "");
			    }
			    // TODO: add source rows not referenced in document, findOutlinesAndUnreferencedSources
				
			    // TODO: use "resp.rows" for sourceRows
			    //var sourceDoc = getCommonSourceProfile(doc, sourceRows);
				
			    // skip blank source
			    if (sourceDetails.length == 0)
			        continue;
			    var combinedSourceprofile = fetchSourceProfile(doc._id + "_source");
			    combinedSourceProfiles.push(combinedSourceprofile);
			}

			var mergedSourceProfiles = mergeDuplicateSourceProfiles(combinedSourceProfiles);
			for (var i = 0; i < mergedSourceProfiles.length; ++i) {
			    var profile = mergedSourceProfiles[i];
			    var authorProfilesUsed = {};
			    if (profile.outline._id != "") {
			        if (typeof profile.outline._id == "string") {
			            collectAuthorProfilesUsed(profile.outline._id, authorProfilesUsed);
			        }
			        else {
			            for (var ioutline = 0; ioutline < profile.outline._id.length; ++ioutline) {
			                var outlineId = profile.outline._id[ioutline];
			                collectAuthorProfilesUsed(outlineId, authorProfilesUsed);
			            }
			        }
			    }
			    var authorDetails = combineAuthorsInCell(authorProfilesUsed);
			    var rowId = createSourceRowId(profile);

				var dataTable1 = $("#sourceSearchResults").data("dataTable");
				var iSettings = dataTable1.fnAddData(
					[	EmptyIfNull(profile.source.details), 
						EmptyIfNull(profile.outline.source.details), 
						authorDetails ],
						false /* don't redraw */
				);
				var drow = dataTable1.fnSettings().aoData[iSettings[0]];
				$(drow.nTr)
					.attr("id", rowId)
					.addClass("creditRow")
					.click(function(event) {
						// first turn off any other selected Row.
						var parentRow = $(event.target).parent("tr");
						selectCreditRow(parentRow);
		  				return false;
					});
				
				// Add some special markup
				var cells = $(drow.nTr).children("td");				
				$((cells)[0]).addClass("sourceDetails");
				$((cells)[1]).addClass("sourceDetails");
				dataTable1.fnDraw();
			};
		}

		function collectAuthorProfilesUsed(outlineId, authorProfilesUsed) {
		    var doc = fetchOutline(outlineId);
		    var authorProfile = fetchAuthorProfileByOutline(doc);
		    if (authorProfile != null && !authorProfilesUsed[authorProfile._id])
		        authorProfilesUsed[authorProfile._id] = authorProfile;
		}

		function combineAuthorsInCell(dict) {
		    var authorDetails = "";
		    var authors = [];
		    for (var id in dict) {
		        var authorProfile = dict[id];
		        authors.push(authorProfile);
		    }
		    authors.sort(sortByFirstName);
		    for (i = 0; i < authors.length; i++ ){
                var authorProfile = authors[i];
                var formattedAuthorDetails = formatName(authorProfile, "", true);
                if (i == 3) {
                    authorDetails += "... (" + (authors.length - i) + " more)";
                    break;
                }
		        if (formattedAuthorDetails.length > 0 && authorDetails.length > 0) {
		            authorDetails += "; ";
		        }
		        authorDetails += formattedAuthorDetails;
		    }
		    return authorDetails;
		}

		function mergeDuplicateSourceProfiles(combinedSourceProfiles) {
		    if (combinedSourceProfiles.length <= 1)
		        return combinedSourceProfiles;
		    // first sort them by content
		    var sortedSourceProfiles = combinedSourceProfiles.sort(compareSourceProfileContent);
		    // now see if we can find matching ones.
		    var mergedSourceProfiles = [];
		    var mergedSourceProfile = null;
		    var prevProfile = clone(combinedSourceProfiles[0]);
		    for (var i = 1; i < combinedSourceProfiles.length; i++) {
		        var currentProfile = clone(combinedSourceProfiles[i]);
		        if (compareSourceProfileContent(prevProfile, currentProfile) == 0) {
		            if (mergedSourceProfile != prevProfile) {
		                mergedSourceProfile = prevProfile;
		            }		                
		            if (typeof mergedSourceProfile._id == "string") {
		                mergedSourceProfile._id = [mergedSourceProfile._id, currentProfile._id];
		                mergedSourceProfile.outline._id = mergedSourceProfile._id;
		                if (mergedSourceProfiles.indexOf(mergedSourceProfile) == -1)
		                    mergedSourceProfiles.push(mergedSourceProfile);
		            }
		            else {
		                mergedSourceProfile._id.push(currentProfile._id);
		                mergedSourceProfile.outline._id = mergedSourceProfile._id;
		            }
		            prevProfile = mergedSourceProfile;
		        }
		        else {
		            if (mergedSourceProfiles.indexOf(prevProfile) == -1)
		                mergedSourceProfiles.push(prevProfile);
		            mergedSourceProfiles.push(currentProfile);
		            prevProfile = currentProfile;
		        }
		    }

		    return mergedSourceProfiles;
		}

		function compareSourceProfileContent(a, b) {
		    // remove id fields, and stringify for string compare.
		    var acontent = deleteIdFieldsAndReturnStringifiedContent(a);
		    var bcontent = deleteIdFieldsAndReturnStringifiedContent(b);
		    return acontent.localeCompare(bcontent);
		}

		function deleteIdFieldsAndReturnStringifiedContent(a) {
		    var aclone = clone(a);
		    delete aclone._id;
		    delete aclone.outline._id;
		    //delete aclone.source._id;
		    return JSON.stringify(aclone);
		}

		function createSourceRowId(combinedSourceProfile) {
		    if (typeof combinedSourceProfile._id == "string")
		        return combinedSourceProfile._id + "_source";
		    return combinedSourceProfile.source._id + "_" + escape(combinedSourceProfile.outline.source.details) + "_source";
		}


	function injectSearchButton(idDtFilter, idbtnSearch, placeholder)
	{
		
		$(jq(idDtFilter + ' label input')).appendTo(jq(idDtFilter));
		if (placeholder)
			$(jq(idDtFilter + ' input')).attr("placeholder", placeholder);
	    $(jq(idDtFilter + '  label')).remove();
	    $(jq(idDtFilter)).append('<br/><button id="'+ idbtnSearch +'" type="button">Search</button>')
	    $(jq(idbtnSearch)).click(function(event)
	    {
	    	var btn = event.target;
	    	$(btn).siblings(".dataTables_filter input").keyup();
	    	return false;
	    });
	}
	
	function initializeTable(idTable, tableOptions, idSearchButton, txtPlaceholder)
	{
		// NOTE: event functions cannot be cloned, so do them after clone.
		tableOptions["fnDrawCallback"] = function ( oSettings ) {
	           	var outlineRowSelected = $(".outlineRowSelected");
	            if (outlineRowSelected.length > 0)
	            {
	                installOutlineRowOptions(outlineRowSelected);
	            }
	            var creditRowSelected = $(".creditRowSelected");
	            if (creditRowSelected.length > 0)
	            {
	            	installCreditRowOptions(creditRowSelected);
	            }	            
	       };
		var dataTable1 = $(jq(idTable)).dataTable(tableOptions);
		injectSearchButton(idTable + "_filter", idSearchButton, txtPlaceholder);
		$(jq(idTable)).data("dataTable", dataTable1);
	}
	
	function isDbId(testId) {
		return testId && testId.substr(testId.length - 2, testId.length) == "ol" &&
			testId.substr(0, 3) == "kyk";
	}

	function SelectUrlSpecifiedDb()
	{
		var dbId = getDbIdFromUrl($.url());
		if (isDbId(dbId))
		{
			// TODO: verify db id format?
			pageToAndSelectOutline(dbId);
		}
	}
	
	function pageToAndSelectOutline(dbId, goToTabSelector)
	{
		var newRow = pageToRow(jq("exampleTable"), jq(dbId));
		selectOutlineRow(newRow);
		if (!goToTabSelector)
			goToTabSelector = "#View";
		$("#tabsMain").tabs("option", "active", getTabIndex(goToTabSelector));
	}

	function getTabIndex(selector) {
		return $(selector).index() - 1;
	}
	
	function changeUrlToSelectedId(rowId)
	{
		var url = $.url();
		var newHash = "";
		if (rowId)
			newHash = "#/" + rowId; // "#!/blah" google indexing -> ?_escaped_fragment_=/blah
		if (document.location.hash != newHash)
			document.location.hash = newHash;
	}
	
	function InitializeDbStuff()
	{
		LoadPersonsAndAuthoredOutlines();
		
		// /_design/outlines/_view
		// /_design/personalProfiles/_view
		$("#submitterIsAuthor").click(function(event) {
			var fSubmitterIsAuthor = this.checked;
			if (fSubmitterIsAuthor)
			{
				var submitterProfile = $("#save-outline-submitter").data('profile-submitter');
		    	if (submitterProfile)
		    		stageSelectedAuthorProfile(submitterProfile, true);
			    else
			    {
    			    var authorProfile = $("#save-outline-author").data('profile-author');
				    if (authorProfile)
				    	stageSelectedSubmitterProfile(authorProfile, true);	
			    }
			} 
			return true;
		});		
		
		$("#btnCreateNewAuthor, #btnCreateNewSubmitter, #btnCreateNewSource").click(function(event) {
								if (event.target.id == "btnCreateNewSource")
								{
									$("#sourceDetailBlock").data("edit-mode", "editProfile");
									loadEditForm(null, null, "editProfile", "[name='updateSourceDetails']");
									return false;	
								}								
								LoadNewProfileForm();
				  				return false;
							});
									
		$("#sourceDetailBlock div textarea").keyup(function(event) 
					{											
  						FitToContent(event.target,'','100');
					});
					
		$("#btnClearSourceOutlineDetails").click(function(event) 
		{
			// load current form data into JSON
			var sourceDetails = $("[name='updateSourceDetails']").getJSON();
			//alert(JSON.stringify(sourceDetails));
			sourceDetails.outline.source.details = "";
			sourceDetails.outline.source.website = "";
			// write back to the form
			$("[name='updateSourceDetails']").populate(sourceDetails);
			// run fit to content.
			$("[name='updateSourceDetails']").find("textarea").each( function(index) 
							{
								FitToContent(this,'','100');
							});
			return false;
		});
		
		$("#btnSubmitterSearch").click(function(event) {
						LoadSubmitterResults();
		  				return false;
					});
		$("#btnClearSubmitterSearch").click(function(event) {
						$("#submitterSearch").val("");
						LoadSubmitterResults();
		  				return false;
					});


		$("#btnClearSourceSearch").click(function(event) {
						$("#sourceSearch").val("");
						LoadSourceResults();
		  				return false;
					});
				
		$("#btnPublishOutline, #btnPublishOutline_Edit").click(publishOutline);
		
		$("#save-outline-author").click(function(event){
			$("#save-outline-credits").data("edit-mode", "save-outline-author");
			// show search
			var stagedProfile = $("#save-outline-author").data("profile-author");
			switchToSearchResultsOnProfile(stagedProfile);
			$("#submitterSpecification").hide();
			$("#sourceSpecification").hide();
			$("#authorSpecification").show();
			return false;
		});
		
		$("#save-outline-submitter").click(function(event){
			$("#save-outline-credits").data("edit-mode", "save-outline-submitter");
			// show search
			var stagedProfile = $("#save-outline-submitter").data("profile-submitter");
			switchToSearchResultsOnProfile(stagedProfile);
			$("#authorSpecification").hide();
			$("#sourceSpecification").hide();
			$("#submitterSpecification").show();
			return false;
		});
		$("#save-outline-source").click(function(event){
			$("#save-outline-credits").data("edit-mode", "save-outline-source");
			// show search
			var stagedProfile = $("#save-outline-source").data("profile-source");
			switchToSearchResultsOnProfile(stagedProfile);
			$("#submitterSpecification").hide();
			$("#authorSpecification").hide();
			$("#sourceSpecification").show();
			return false;
		});
		
		$("#btnAuthorCancel").click(function(event) {
			$("#authorSpecification").hide();
			ClearEditMode();
			return false;
		});
		
		$("#btnAuthorOk").click(function(event) {
			var selectedRow = $(".creditRowSelected");
			var profile = getSelectedPersonProfile(selectedRow);
			stageSelectedAuthorProfile(profile);
			//alert("btnAuthorOk : "+ profile.name.middle);
			$("#authorSpecification").hide();
			return false;
		});
		
		$("#btnSubmitterOk").click(function(event) {
			var selectedRow = $(".creditRowSelected");
			var profile = getSelectedPersonProfile(selectedRow);
			stageSelectedSubmitterProfile(profile);
			$("#submitterSpecification").hide();
			return false;
		});
		$("#btnSourceOk").click(function(event) {
			var selectedRow = $(".creditRowSelected");
			var profile = getSelectedSourceProfile(selectedRow);
			stageSelectedSourceProfile(profile);
			$("#sourceSpecification").hide();
			return false;
		});
		
		$("#btnAuthoredWithKayak").click(function(event)
		{
			stageKayakAsSource();
			return false;
		});
		
		$("#btnAuthoredWithKayak").parent("td").parent("tr").find("a").click(function(event) {
			stageKayakAsSource();
			return false;
		});
		
		function stageKayakAsSource()
		{
			var profile = fetchSourceProfile("kyk:1845-12-23T03:22:15.481Z:sr_source");
			stageSelectedSourceProfile(profile);
			$("#sourceSpecification").hide();
		}
		
		$("#btnSubmitterCancel").click(function(event) {
			$("#submitterSpecification").hide();
			ClearEditMode();
			return false;
		});
		
		$("#btnSourceCancel").click(function(event) {
			$("#sourceSpecification").hide();
			ClearEditMode();
			return false;
		});
		
		function ClearEditMode()
		{
			$("#save-outline-credits").data("edit-mode", "");
		}
		
		function getSelectedPersonProfile(selectedRow)
		{
			var authorRows = getDbRows();
			if (selectedRow && selectedRow.length != 0)
			{
				var personProfileId = $(selectedRow).attr("id");		
				return collectProfileDocs("personProfile", authorRows, function(rowDoc){
						if (rowDoc._id == personProfileId)
					    		return true;
					    	return false;
					}, true );
			}
			return null;
		}
		
		function getSelectedSourceProfile(selectedRow)
		{
			if (selectedRow && selectedRow.length != 0)
			{
				var sourceProfileId = $(selectedRow).attr("id");
				var sourceProfile = fetchSourceProfile(sourceProfileId);		
				return sourceProfile;
			}
			return null;
		}
		
		$("#btnCancelSubmitAuthor").click(function(event) {
			var editMode = $("#save-outline-credits").data("edit-mode");
			if (editMode == "save-outline-author")
				SwitchToAuthorProfileSearchResults();
			else if (editMode == "save-outline-submitter")
				SwitchToSubmitterProfileSearchResults();
			//var profile = $(jq(editMode)).data("profile-" + (editMode == "save-outline-author" ? "author" : "submitter"));
			//switchToSearchResultsOnProfile(profile);
			return false;
		});
		
		$("#btnCancelSubmitSource").click(function(event) {
			var editMode = $("#save-outline-credits").data("edit-mode");
			if (editMode == "save-outline-author")
				SwitchToAuthorProfileSearchResults();
			else if (editMode == "save-outline-submitter")
				SwitchToSubmitterProfileSearchResults();
			else if (editMode == "save-outline-source")
				SwitchToSourceProfileSearchResults();
			//var profile = $(jq(editMode)).data("profile-" + (editMode == "save-outline-author" ? "author" : "submitter"));
			//switchToSearchResultsOnProfile(profile);
			return false;
		});
		
		$("#btnSubmitPersonProfile").click(submitPersonProfile);
		
		$("#btnSubmitSource").click(submitSource);
	}
	
		function createTimeStampArray(dateNow)
	{
		var sdate = stringifyDateNow(dateNow);
		var time = sdate.split("T")[1];
		return [dateNow.getFullYear(), dateNow.getMonth() + 1, dateNow.getDate(), 
				time];
	}
	
	function setOrReset(stagedProfile, objToSetOrReset, propertyToSet, setFunc)
	{
		if (!stagedProfile || !stagedProfile._id || stagedProfile._id.length == 0)
		{
			if (objToSetOrReset[propertyToSet])
				delete objToSetOrReset[propertyToSet];
		}
		else
		{
			if (!objToSetOrReset[propertyToSet])
				objToSetOrReset[propertyToSet] = {};
			setFunc(objToSetOrReset, propertyToSet, stagedProfile);
		}
	}
	
	function applyCitationToOutline()
	{
		var authorProfileStaged = $("#save-outline-author").data('profile-author');
		var submitterProfileStaged = $("#save-outline-submitter").data('profile-submitter');
		var sourceStaged = $("#save-outline-source").data('profile-source');
		
		setOrReset(authorProfileStaged, mainOutline.head, "author", function(objToSetOrReset, propertyToSet, stagedProfile) 
		{
			objToSetOrReset[propertyToSet].guid = stagedProfile._id;
		});			
		setOrReset(submitterProfileStaged, mainOutline.head, "submittedBy", function(objToSetOrReset, propertyToSet, stagedProfile) 
		{
			objToSetOrReset[propertyToSet].guid = stagedProfile._id;
		});
		// we want to save the guid of the common outline, not our outline.
		setOrReset(sourceStaged, mainOutline.head, "source", function(objToSetOrReset, propertyToSet, stagedProfile) 
		{
			objToSetOrReset[propertyToSet] = stagedProfile.outline.source;
			objToSetOrReset[propertyToSet].guid = stagedProfile.source._id;
		});
	}
	
	function publishOutline(event)
	{


		// disable clicking of publishing outline until
		// at minimum, the following has been specified:
		// 1) An outline with more than 0 concepts
		// or 2) Author Specified
		// or 3) Source Specified
		// or 4) Submitter Specified
		ApplyOutlineHeadChanges();
		var authorProfileStaged = $("#save-outline-author").data('profile-author');
		var submitterProfileStaged = $("#save-outline-submitter").data('profile-submitter');
		var sourceStaged = $("#save-outline-source").data('profile-source');
		var fIsNewOutline = !mainOutline._id;			
		var fCanPublish = (mainOutline.body.concepts.length > 0 || 
			authorProfileStaged && authorProfileStaged._id ||
			submitterProfileStaged && submitterProfileStaged._id ||
			sourceStaged && sourceStaged._id);
		if (!fCanPublish)
		{			
			alert("Cannot publish an empty outline without specifying author, source, or submitter");
			return false;
		}
			
		// next see if any changes need to be made
		applyCitationToOutline();
		var mainOutlineJSON_current = JSON.stringify(mainOutline);
		var mainOutlineJSON_orig = $("body").data("mainOutlineJSON-orig");
		if (!fIsNewOutline && mainOutlineJSON_current == mainOutlineJSON_orig)
		{
			alert("No changes have been made that need to be saved.")
			return false;	
		}		
		else
		{
			$(this).unbind(event);
			/* NOTE: need to fill in the following
			
				"submissionTimestamp": [\
					2011,\
					6,\
					6,\
					"10:30:00.000Z"\
			// bcvRange
			// authorShortname				
			
			**/
			if (sourceStaged && sourceStaged.outline && sourceStaged.outline._id == "newOutlineStub")
			{
				var exampleRows = getDbRows(); 
				findAndDo(exampleRows, "newOutlineStub", function(rows, indexFound) {
						rows.splice(indexFound, 1); 
	    				//alert("removed newOutlineStub")
	    		});
				// if guid is newOutlineStub then replace that row
			}

			
			var dateNow = new Date();
			if (fIsNewOutline)
			{
				var newId = createIDFromDate(dateNow, ":ol");
				mainOutline._id = newId;
				mainOutline.head.submissionTimestamp = createTimeStampArray(dateNow);
			}
			else
			{
				// detect if any data has changed.
				mainOutline.head.modifiedTimestamp = createTimeStampArray(dateNow);
			}
			if (authorProfileStaged)
			{
				var authorProfile = authorProfileStaged;
				mainOutline.head.author.authorShortname = 
					authorProfile.name.first[0].toLowerCase() + 
					EmptyIfNull(EmptyIfNull(authorProfile.name.middle)[0]).toLowerCase() + 
					authorProfile.name.last.toLowerCase();
			}
			
			if (dbMain)
			{
				dbMain.put(mainOutline._id, mainOutline, function(resp) {
					
					if (resp.ok)
			        {
			        	mainOutline["_rev"] = resp.rev;
			        	publishOutlineChangesToTableView(mainOutline);
			        }
			        //alert("Remember to check for ok: " + JSON.stringify(resp));
					$("#btnPublishOutline, #btnPublishOutline_Edit").click(publishOutline);
			    });
			}								
		    else // DEBUG
		    {		    	
		    	publishOutlineChangesToTableView(mainOutline);
		 		$(this).click(publishOutline);   	
		    }
				
		}
		
		return false;
	}

	function publishOutlineChangesToTableView(outline)
	{
		var rowId = outline._id;
    	var newRow = {"id" : rowId, "key" : [rowId, 1], "value" : outline};
    	var getResponse = getDb();
    	if (!replaceRow(getResponse.rows, newRow.id, newRow))
    	{
    		getResponse.rows.push(newRow);
    		getResponse.total_rows += 1;
    	}			    	
    	cacheDbInDom(getResponse);
    	LoadPersonsAndAuthoredOutlines();
    	// clear outline table to prepare for the new row item
		$("#exampleTable_filter input").val("");
		$("#exampleTable_filter input").keyup();
    	var newRowInTable = pageToRow(jq("exampleTable"), jq(outline._id));
    	selectOutlineRow(newRowInTable);
    	alert("Changes have been published");
    	DisplayBooksAndChapters();    	
	}
	
	/*
	 * Return date Now in the format of "2012-05-06T12:41:44.546Z" (24chars)
	 */
	function stringifyDateNow(dateNow)
	{
		if (!dateNow)
			dateNow = new Date();
		var sdate = JSON.stringify(dateNow);
		return sdate.substr(1, sdate.length - 2);
	}
	
	/*
	 * "kyk:2012-05-06T12:41:44.546Z" (28 chars) . (sr [source] ps [person]) (ol [outline])
	 */
	function createIDFromDateNow(suffix)
	{
		return createIDFromDate(null, suffix);
	}
	
	function createIDFromDate(dateNow, suffix)
	{
		if (!dateNow)
			dateNow = new Date();
		var newId = stringifyDateNow(dateNow);
		newId = "kyk:" + newId + EmptyIfNull(suffix);
		return newId;
	}
	
	function publishSourceProfileChangesToTableView(updatedProfile, profileOriginal, dbRows)
	{
		var editMode = $("#sourceDetailBlock").data("edit-mode");
    	var commonSourceId = "";
    	if (editMode == "editProfile" || editMode == "editCommon")    	
    	{
    		if (profileOriginal && profileOriginal.source._id.length > 0)
	    	{
	    		commonSourceId = profileOriginal.source._id;
	    		var newRow = {"id" : commonSourceId, "key" : [commonSourceId, 0], "value" : clone(updatedProfile.source) };
	    		newRow.value["head"] = { "contentType": "sourceProfile" };
	    		//alert(JSON.stringify(newRow));
	    		replaceRow(dbRows, commonSourceId, newRow, true);
	    	}
    	}
    	if (editMode == "editProfile" && profileOriginal && profileOriginal.outline._id.length > 0)
    	{
    		if (commonSourceId.length > 0)
    			updatedProfile.outline.source["guid"] = commonSourceId;

    		graftSource(dbRows, profileOriginal.outline._id, updatedProfile.outline.source);
    	}
    	updateStagedProfilesIfNeeded(updatedProfile);
    	switchToSearchResultsOnProfile(updatedProfile);
	}
	
	function SpecificSourceHasContent(testSpecificSource)
	{
		return testSpecificSource.details.length > 0 || 
	    		testSpecificSource.website.length > 0;
	}
	
	function CommonSourceHasContent(testCommonSource)
	{
		return testCommonSource.details.length > 0 || 
	    		testCommonSource.website.length > 0 || 
	    		testCommonSource.publisherDetails.length > 0;
	}
	
	function CommonSourceHasChanged(testCommonSource, originalSource)
	{
		return testCommonSource.details != originalSource.details || 
	    	testCommonSource.website != originalSource.website ||
	    	testCommonSource.publisherDetails != originalSource.publisherDetails ||
	    	testCommonSource.media != originalSource.media;
	}
	
	function submitSource(event)
	{
		var exampleRows = getDbRows();
		var profileOriginal =  $("#sourceDetailBlock").data("profile-original");
	    var editMode = $("#sourceDetailBlock").data("edit-mode"); // editProfile / editCommon / copyToNewProfile
	    var updatedProfile = $("[name='updateSourceDetails']").getJSON();
	    updatedProfile.source.head = {"contentType" : "sourceProfile"};
	    //alert(JSON.stringify(updatedProfile));
	    if (!CommonSourceHasContent(updatedProfile.source) && 
	    	!SpecificSourceHasContent(updatedProfile.outline.source))
    	{
    		alert("Source update requires that you fill in some information.")
    		return;
    	}
    	$(this).unbind(event); // TODO: use on/off
	    
	    var profileSwitchTo = null;
	    if (editMode == "copyToNewProfile" || !profileOriginal)
	    {
	    	profileSwitchTo = clone(updatedProfile);
	    	var newGuid = "";
	    	if (CommonSourceHasContent(updatedProfile.source))
	    	{
	    		if (!profileOriginal || CommonSourceHasChanged(updatedProfile.source, profileOriginal.source))
    			{
    				// something has changed, so create a new common
			    	newGuid = createIDFromDateNow(":sr");
			    	profileSwitchTo.source._id = newGuid;
			    	var newRow = {"id" : newGuid, "key" : [newGuid, 0], "value" : profileSwitchTo.source };
			        newRow.value._id = newGuid;
		    		newRow.value["head"] = { "contentType": "sourceProfile" };				
		    		// replace authorRow with new profile
		    		exampleRows.splice(0, 0, newRow);
	    		}
	    		else
	    		{
	    			newGuid = updatedProfile.source._id;
	    		}
	    		profileSwitchTo._id = newGuid;
    		}
    		else
    		{
    			// no content. 
    			// apparently this only has outline source details.
    		}
    		
    		var outlineSource = updatedProfile.outline.source;
    		if (outlineSource.details.length > 0 ||
    			outlineSource.website.length > 0)
	    	{		    		
	    		var newOutlineSource = clone(outlineSource);
	    		if (newGuid.length > 0)
	    			newOutlineSource["guid"] = newGuid;
	    		
	    		var guidNewOutlineStub = "newOutlineStub";
	    		var newOutlineStub;
	    		if (!findAndDo(exampleRows, guidNewOutlineStub, function(rows, indexFound) { 
	    				newOutlineStub = rows[indexFound].value;
	    			}))
				{
					newOutlineStub = createBlankOutline();
	    			newOutlineStub._id = guidNewOutlineStub;
	    			var newRow = {"id" : guidNewOutlineStub, "key" : [guidNewOutlineStub, 0], "value" : newOutlineStub };
	    			exampleRows.splice(0, 0, newRow);
				}
		
				//alert(JSON.stringify(outlineSource));
				newOutlineStub.head.source = newOutlineSource;
				profileSwitchTo._id = guidNewOutlineStub;
	    	}
	    }
		else if (editMode == "editProfile" || editMode == "editCommon")
	    {	    	
	    	if (profileOriginal)
	    		profileSwitchTo = updatedProfile;
	    }
	    
	    findAndDo(exampleRows, profileSwitchTo.source._id, function(rows, indexFound) 
	    {
	    	var docToUpdate = rows[indexFound].value;
	    	if (docToUpdate._rev)
	    		profileSwitchTo.source["_rev"] = docToUpdate._rev;
	    });
	    
	    var specificDetailsMsg = "Outline specific details will be updated after publishing the outline.";
	    // TODO: do I need to write the db cache back to the DOM?
		if (dbMain && CommonSourceHasContent(updatedProfile.source) && 
			(!profileOriginal || CommonSourceHasChanged(updatedProfile.source, profileOriginal.source)))
		{
			try
			{
				dbMain.put(profileSwitchTo.source._id, profileSwitchTo.source, function(resp) {
			        if (resp.ok)
			        {
			        	profileSwitchTo["_rev"] = resp.rev;
			        	alert("Common Source Profile Changes Published. (" + specificDetailsMsg + ")"); // Debug: " + JSON.stringify(resp));
					    publishSourceProfileChangesToTableView(profileSwitchTo, profileOriginal, exampleRows);
			        }
			        else
			        {
			        	alert("error saving source to database." + JSON.stringify(profileSwitchTo)+ "err: " +  JSON.stringify(resp));
			        }
			    });
		    }
		    catch(err)
		    {
		    	alert("error saving source to database." + JSON.stringify(profileSwitchTo)+ "err: " +  JSON.stringify(err));
		    }
		 }
	    else
	    {
	    	if (!CommonSourceHasContent(updatedProfile.source))
	    	{
	    		alert(specificDetailsMsg);
	    	}
	    	publishSourceProfileChangesToTableView(profileSwitchTo, profileOriginal, exampleRows);
	    }
		
		$(this).click(submitSource);
		return false;
		
	}
	
	function submitPersonProfile(event)
	{
		var authorRows = getDbRows();
		// TODO: replace with on/off?
		// first do some checking (don't create blank profile)
		// submit new profile
		var personProfile = $("[name='updatePersonProfile']").getJSON();
		//alert(JSON.stringify(personProfile));	
		if (personProfile.name.first.length == 0)
		{
			alert("Form requires First name");
			return false;
		}
		if (personProfile.name.last.length == 0)
		{
			alert("Form requires Last name");
			return false;
		}
		$(this).unbind(event);	
		
		personProfile.head = {"contentType" : "personProfile"};
		
		// only add interesting title. Not the default.fpu
		if (personProfile.name.title == "(Title)")
		{
			personProfile.name.title = "";
		}

		var queryResults = $("[name='updatePersonProfile']").find("[name='_id']");
		var personProfileId = queryResults ? queryResults[0].value : null;
		var fIsNewProfile = !personProfileId || personProfileId.length == 0;
		//alert(personProfileId);
		if (fIsNewProfile)
		{
			// check that identical entry doesn't exist already
			var matchingDoc = collectProfileDocs("personProfile", authorRows, matchByNewAuthorFormFields, true);
			if (matchingDoc)
			{
				alert("Warning: A matching person profile already exists.");
			}
			
			var newId = createIDFromDateNow(":ps");
			// add head information
			personProfile._id = newId;
			// remove revision since this is a new object.
			delete personProfile._rev;
		}
		else
		{
			var matchingDocs = collectProfileDocs("personProfile", authorRows, matchByNewAuthorFormFields, false);
			if (matchingDocs.length > 0)
			{
				for (var i=0; i < matchingDocs.length; i++) {
				  if (matchingDocs[i]._id == personProfileId)
				  	switchToSearchResultsOnProfile(personProfile);
				  	$(this).click(submitPersonProfile);
				  	return true; // no changes.
				};
				alert("Warning: A matching person profile already exists.");
			}
			var personProfileRev = $("[name='updatePersonProfile']").find("[name='_rev']");
			
			// verify some overlap in profiles?
			/*
			var oldProfile = collectProfileDocs("personProfile", authorRows, function(rowDoc){
					if (rowDoc._id == personProfileId)
				    		return true;
				    	return false;
				}, true );
			*/
			
			// verify that record with this Id/Rev matches some information?
			// Make sure the record in memory matches this Rev.
		}
		
		// now post to server.
		//alert(JSON.stringify(personProfile));
		if (dbMain)
			dbMain.put(personProfile._id, personProfile, function(resp) {
		        if (resp.ok)
		        {
		        	personProfile["_rev"] = resp.rev;
		        	alert("Person Profile Published."); // Debug: " + JSON.stringify(resp));
				    updateStagedProfilesIfNeeded(personProfile);
				    publishPersonProfileChangesToTableView(personProfile);
		        	loadDataSet(false);		        	
		        }
				$("#btnSubmitPersonProfile").click(submitPersonProfile);
		    });
	    else  // Debug
	    {
	    	updateStagedProfilesIfNeeded(personProfile);
	    	publishPersonProfileChangesToTableView(personProfile);
	    	$(this).click(submitPersonProfile);
	    }
	    
		//alert("btnSubmitPersonProfile : "+ profile.name.middle);
		return false;
	}
	
	function publishPersonProfileChangesToTableView(personProfile)
	{
		var newRow = {"id" : personProfile._id, "key" : [personProfile._id, 0], "value" : personProfile};
		
		var getResponse = getDb();
		if (!replaceRow(getResponse.rows, newRow.id, newRow))
    	{
    		getResponse.rows.push(newRow);
    		getResponse.total_rows += 1;
    	}
    	cacheDbInDom(getResponse);
	    // TODO: lookup _rev version later
	    switchToSearchResultsOnProfile(personProfile);
	}
	
	function replaceRow(rows, targetId, newRow)
	{

		return findAndDo(rows, targetId, function(rows, indexToReplace)
		{
			rows.splice(indexToReplace, 1, newRow);
		});
	}
	
	function graftSource(rows, targetId, outlineSource)
	{

		findAndDo(rows, targetId, function(rows, indexToReplace)
		{
			var outline = rows[indexToReplace].value;
			
			//alert(JSON.stringify(outlineSource));
			outline.head.source = outlineSource;
			//alert(JSON.stringify(outline));
		});
	}
	
	function findAndDo(rows, targetId, doSomething)
	{
		var indexToReplace = -1;
		for (var i=0; i < rows.length; i++) {
		  	if (rows[i].value._id == targetId)
		  	{
		  		indexToReplace = i;
		  		break;
		  	}
		};
		if (indexToReplace >= 0)
		{
			doSomething(rows, indexToReplace);
			return true;
		}
		return false;
	}
	
	var defaultCitationLinkContent = "Click to search/specify";
	
	function stageSelectedAuthorProfile(profile, fIgnoreSubmitterIsAuthor)
	{
		$("#save-outline-author")
			.text(formatName(profile, defaultCitationLinkContent))
			.data('profile-author', profile);
		var fSubmitterIsAuthor = $("#submitterIsAuthor").is(":checked");
		if (fSubmitterIsAuthor && !fIgnoreSubmitterIsAuthor)
		{
			$("#save-outline-submitter")
				.text(formatName(profile, defaultCitationLinkContent))
				.data('profile-submitter', profile);
		}
		//alert("stageSelected : "+ profile.name.middle);	
	}
	
	function stageSelectedSubmitterProfile(profile, fIgnoreSubmitterIsAuthor)
	{
		$("#save-outline-submitter")
			.text(formatName(profile, defaultCitationLinkContent))
			.data('profile-submitter', profile);
		var fSubmitterIsAuthor = $("#submitterIsAuthor").is(":checked");
		if (fSubmitterIsAuthor && !fIgnoreSubmitterIsAuthor)
		{
			$("#save-outline-author")
				.text(formatName(profile, defaultCitationLinkContent))
				.data('profile-author', profile);
		}
		//alert("stageSelected : "+ profile.name.middle);	
	}
	
	function stageSelectedSourceProfile(profile)
	{
		$("#save-outline-source")
			.text(formatCombinedSource(profile, defaultCitationLinkContent))
			.data('profile-source', profile);	
	}
	
	function updateStagedProfilesIfNeeded(profile)
	{
		var authorProfileStaged = $("#save-outline-author").data('profile-author');
        if (authorProfileStaged && authorProfileStaged._id == profile._id)
        {
        	stageSelectedAuthorProfile(profile, true);
        }
        var submitterProfileStaged = $("#save-outline-submitter").data('profile-submitter');
        if (submitterProfileStaged && submitterProfileStaged._id == profile._id)
        {
        	stageSelectedSubmitterProfile(profile, true);
        }
        var sourceProfileStaged = $("#save-outline-source").data('profile-source');
        if (sourceProfileStaged && sourceProfileStaged._id == profile._id)
        {
        	stageSelectedSourceProfile(profile);
        }
	}
		
	function switchToSearchResultsOnProfile(profile)
	{
					// create new search string based on updated profile
			var keywords = "";
			var editMode = $("#save-outline-credits").data("edit-mode");
			if (profile)
			{
				if (editMode == "save-outline-submitter" || editMode == "save-outline-author")
				{
					keywords = convertToKeywordString(
						[profile.name.first,
						profile.name.middle,
						profile.name.last]);
					if (profile.organization)
					{
						var keywords2 = convertToKeywordString( 
							[profile.organization.name,
							profile.organization.website]);
						keywords += " " + keywords2;
					}
				}
				else
				{
					keywords = convertToKeywordString(
						[profile.source.details,
						profile.outline.source.details]);
				}
				// TODO: calculate keywords for sources
			}			
			if (editMode == "save-outline-submitter")
			{
				$("#submitterProfileResults_filter input").val(keywords);
			} 
			else if (editMode == "save-outline-author")
			{
				$("#authorResults_filter input").val(keywords);
			}
			else if (editMode == "save-outline-source")
			{
				$("#sourceSearchResults_filter input").val(keywords);
				LoadSourceResultsCallback(getDbRows());
				if (profile)
				{
				    var parentRow = pageToRow(jq("sourceSearchResults"), jq(createSourceRowId(profile)));
				    if (!parentRow) {
				        var profileFakeMerged = clone(profile);
				        profileFakeMerged._id = [profileFakeMerged._id, profileFakeMerged._id];
				        profileFakeMerged.outline.source._id = profileFakeMerged._id;
                        parentRow = pageToRow(jq("sourceSearchResults"), jq(createSourceRowId(profileFakeMerged)));
				    }

					selectCreditRow(parentRow);
				}
			}

			if (editMode == "save-outline-submitter" || editMode == "save-outline-author")
			{
				LoadAuthorResultsCallback(getDbRows(), editMode == "save-outline-submitter");
				// now highlight the new row.
				if (profile)
				{
					var tableId = null;
					if (editMode == "save-outline-author")
						tableId = jq("authorResults");
					if (editMode == "save-outline-submitter")
						tableId = jq("submitterProfileResults");
					var parentRow = pageToRow(tableId, jq(profile._id));
					selectCreditRow(parentRow);
				}
				$("[name='updatePersonProfile']").find("[name='_id']").val(""); // reset id, to make sure we don't accidentally use an old id.
				$("[name='updatePersonProfile']").find("[name='_rev']").val("");
			}
		
	}
	
	function findRow(table, rowId)
	{
		var oTable = $(table).data("dataTable");
		var selectedRow = oTable.$(rowId);
		return selectedRow;
	}
	
	function convertToKeywordString(list)
	{
		var keywords = "";
		for (var i=0; i < list.length; i++) {
			var word = list[i];
		   if (word && word.search(/[a-zA-Z]/) != -1)
		   {
		   		if (i > 0)
		   			keywords += " ";
		   		keywords += word;
		   }

		};
		return keywords;
	}		

/**
 * JSON.stringify(getDb(), null, '\t')
 * Find \n Replace: \\\n
 * Or better: use Firefox->Console and expand the GET http://kayak.iriscouch.com/outlineslive/_design/everything/_view/byDocId	.
 */
var authorsAndOutlinesResponse = {"total_rows":50,"offset":0,"rows":[
{"id":"56e905abc996fa0a1b824d4118002410","key":["56e905abc996fa0a1b824d4118002410","source: Not yet referenced"],"value":{"_id":"56e905abc996fa0a1b824d4118002410","_rev":"1-bf320b4c33040147e4aded024bdefdbd","head":{"contentType":"sourceProfile"},"media":"book","details":"Not yet referenced","website":"","publisherDetails":""}},
{"id":"774c87bd5ec2e4afb24a0ce0d1000c9f","key":["774c87bd5ec2e4afb24a0ce0d1000c9f","chiasm: unspecified author"],"value":{"_id":"774c87bd5ec2e4afb24a0ce0d1000c9f","_rev":"2-f594aedb0ddbc74513c80e90516f2244","head":{"submissionTimestamp":[2011,12,28,"10:30:00.000Z"],"bcvRange":[],"title":"testing","ScriptureRange":"","contentType":"chiasm"},"body":{"concepts":[{"content":"puppies"},{"content":"piglets"},{"content":"squeal"},{"content":"wimper"}]}}},
{"id":"kyk:1845-12-23T03:22:15.481Z:sr","key":["kyk:1845-12-23T03:22:15.481Z:sr","source: kayak"],"value":{"_id":"kyk:1845-12-23T03:22:15.481Z:sr","_rev":"2-9803b75049eb3c4e9e32b103c17f59cd","head":{"contentType":"sourceProfile"},"media":"website","details":"kayak","website":"ericlovesallison.org/BibleTools/kayak","publisherDetails":""}},
{"id":"kyk:1974-12-23T03:22:15.481Z:ps","key":["kyk:1974-12-23T03:22:15.481Z:ps","person: Pyle, Eric"],"value":{"_id":"kyk:1974-12-23T03:22:15.481Z:ps","_rev":"3-df8e1c679c8938bf7d912476b664151b","name":{"title":"","first":"Eric","middle":"","last":"Pyle","suffix":""},"organization":{"name":"Wycliffe Bible Translators","website":"http://www.wycliffe.org"},"head":{"contentType":"personProfile"}}},
{"id":"kyk:2011-06-05T18:47:27.748Z:ps","key":["kyk:2011-06-05T18:47:27.748Z:ps","person: Greene, Elliott"],"value":{"_id":"kyk:2011-06-05T18:47:27.748Z:ps","_rev":"2-b7ebc5f9aec26013507d8b42ef57cec4","head":{"contentType":"personProfile"},"name":{"title":"Prof.","last":"Greene","first":"Elliott","middle":""},"organization":{"name":"Redeemer Seminary","website":"http://www.redeemerseminary.org/"},"urls":["http://www.ccef.org/authors/elliott-greene","http://www.redeemerseminary.org/faculty.html"]}},
{"id":"kyk:2011-06-06T18:47:27.748Z:ol","key":["kyk:2011-06-06T18:47:27.748Z:ol","chiasm: egreene"],"value":{"_id":"kyk:2011-06-06T18:47:27.748Z:ol","_rev":"21-d1ed85705c82e14deec99f48f7dc6ff1","head":{"submissionTimestamp":[2011,6,6,"18:47:27.748Z"],"bcvRange":["Matt",7,6],"author":{"guid":"kyk:2011-06-05T18:47:27.748Z:ps","authorShortname":"egreene"},"submittedBy":{"guid":"kyk:1974-12-23T03:22:15.481Z:ps"},"source":{"guid":"kyk:2011-06-06T18:47:27.848Z:sr","details":"1999"},"title":"","ScriptureRange":"Matthew 7:6","contentType":"chiasm"},"body":{"concepts":[{"content":"dogs"},{"content":"pigs"},{"content":"trample under feet"},{"content":"turn and tear to pieces"}]}}},
{"id":"kyk:2011-06-06T18:47:27.848Z:sr","key":["kyk:2011-06-06T18:47:27.848Z:sr","source: Redeemer Seminary, Greek Class"],"value":{"_id":"kyk:2011-06-06T18:47:27.848Z:sr","_rev":"2-c36f57fd24b8fec09a4547ee6e75d061","head":{"contentType":"sourceProfile"},"media":"class","details":"Redeemer Seminary, Greek Class","website":"http://www.redeemerseminary.org","publisherDetails":""}},
{"id":"kyk:2011-06-06T19:00:00.001Z:ol","key":["kyk:2011-06-06T19:00:00.001Z:ol","chiasm: jbjordan"],"value":{"_id":"kyk:2011-06-06T19:00:00.001Z:ol","_rev":"23-c761563a8cd09627cec9d30f6de7b702","head":{"submissionTimestamp":[2011,6,6,"19:00:00.001Z"],"bcvRange":["Matt",1,1,"Matt",28,20],"author":{"guid":"kyk:2011-06-06T19:00:00.002Z:ps","authorShortname":"jbjordan"},"submittedBy":{"guid":"kyk:1974-12-23T03:22:15.481Z:ps"},"source":{"guid":"kyk:2011-06-06T19:00:00.004Z:sr","details":"#94, Apr 1997","website":"http://www.biblicalhorizons.com/biblical-horizons/no-94-toward-a-chiastic-understanding-of-the-gospel-according-to-matthew-part-1/"},"title":"","ScriptureRange":"Matthew 1:1-28:20","contentType":"chiasm"},"body":{"concepts":[{"content":"Genealogy (past), 1:1-17"},{"content":"First Mary and Jesus’ birth, 1:18-25"},{"content":"Gifts of wealth at birth, 2:1-12"},{"content":"Descent into Egypt; murder of children, 2:13-21"},{"content":"Judea avoided, 2:22-23"},{"content":"Baptism of Jesus, 3:1–8:23"},{"content":"Crossing the sea, 8:24–11:1"},{"content":"John’s ministry, 11:2-19"},{"content":"Rejection of Jesus, 11:20-24"},{"content":"Gifts for the new children, 11:25-30"},{"content":"Attack of Pharisees, 12:1-13"},{"content":"Pharisees determine to kill the innocent Servant, 12:14-21"},{"content":"Condemnation of Pharisees, 12:22-45"},{"content":"Gifts for the new children, 13:1-52"},{"content":"Rejection of Jesus, 13:53-58"},{"content":"John’s death, 14:1-12"},{"content":"Crossing the sea, 14:13–16:12"},{"content":"Transfiguration of Jesus, 16:13–18:35"},{"content":"Judean ministry, 19:1–20:34"},{"content":"Ascent into Jerusalem; judgment on Jews, 21:1–27:56"},{"content":"Gift of wealth at death, 27:57-66"},{"content":"Last Marys and Jesus’ resurrection, 28:1-15"},{"content":"Commission (future), 28:16-20"}]}}},
{"id":"kyk:2011-06-06T19:00:00.002Z:ps","key":["kyk:2011-06-06T19:00:00.002Z:ps","person: Jordan, James"],"value":{"_id":"kyk:2011-06-06T19:00:00.002Z:ps","_rev":"2-cd07b6aea919bb26ca74f5d7840f7e85","head":{"contentType":"personProfile"},"name":{"first":"James","last":"Jordan","middle":"B."},"organization":{"name":"Biblical Horizons","website":"http://www.biblicalhorizons.com/"},"urls":["http://www.facebook.com/pages/James-B-Jordan/120290590930"]}},
{"id":"kyk:2011-06-06T19:00:00.004Z:sr","key":["kyk:2011-06-06T19:00:00.004Z:sr","source: Biblical Horizons"],"value":{"_id":"kyk:2011-06-06T19:00:00.004Z:sr","_rev":"2-da71c66160fde692d546f1d4b48c09f4","head":{"contentType":"sourceProfile"},"media":"website","details":"Biblical Horizons","website":"http://www.biblicalhorizons.com","publisherDetails":""}},
{"id":"kyk:2011-06-18T18:47:27.747Z:ps","key":["kyk:2011-06-18T18:47:27.747Z:ps","person: Hilleke, Thomas"],"value":{"_id":"kyk:2011-06-18T18:47:27.747Z:ps","_rev":"2-cce8c771127891e98e8310a97dafd1b3","head":{"contentType":"personProfile"},"name":{"last":"Hilleke","first":"Thomas"}}},
{"id":"kyk:2011-06-18T18:47:27.748Z:ol","key":["kyk:2011-06-18T18:47:27.748Z:ol","chiasm: thilleke"],"value":{"_id":"kyk:2011-06-18T18:47:27.748Z:ol","_rev":"23-297086784afb152104ccc41186ef4980","head":{"submissionTimestamp":[2011,6,18,"18:47:27.748Z"],"bcvRange":["Jonah",1,1,"Jonah",4,11],"author":{"guid":"kyk:2011-06-18T18:47:27.747Z:ps","authorShortname":"thilleke"},"submittedBy":{"guid":"kyk:1974-12-23T03:22:15.481Z:ps"},"source":{"guid":"kyk:2011-06-18T18:47:27.948Z:sr"},"title":"The Names of God in Jonah","contentType":"chiasm","ScriptureRange":"Jonah 1:1-4:11"},"body":{"concepts":[{"content":"1:1-4, Yahweh deals with Yonah"},{"content":"1:5-8, Elohim, God of water deals with the unconverted Gentiles"},{"content":"1:9, Yonah invokes the name Yahweh Elohim"},{"content":"1:10-17, Yahweh deals with the converted Gentiles and Yonah"},{"content":"2:1, Yonah invokes the name Yahweh Elohim"},{"content":"2:2-6, Yahweh deals with Yonah"},{"content":"2:6, Yonah invokes the name Yahweh Elohim"},{"content":"2:7-3:3, Yahweh deals with Yonah"},{"content":"3:3-4:1, Elohim deals with Gentiles before and after conversion. They do not offer sacrifice and take vows like the salty ones."},{"content":"4:2-5, Yahweh deals with Yonah (Yonah invokes the name El in 4:2 as part of his prayer to Yahweh)"},{"content":"4:6, Yahweh Elohim deals with Yonah"},{"content":"4:7-9, Elohim deals with Yonah"},{"content":"4:10-11, Yahweh deals with Yonah"}]}}},
{"id":"kyk:2011-06-18T18:47:27.948Z:sr","key":["kyk:2011-06-18T18:47:27.948Z:sr","source: Biblical Horizons Yahoogroup"],"value":{"_id":"kyk:2011-06-18T18:47:27.948Z:sr","_rev":"3-217da62ee113d78a53854edb1edbc214","head":{"contentType":"sourceProfile"},"media":"email","details":"Biblical Horizons Yahoogroup","website":"","publisherDetails":""}},
{"id":"kyk:2011-10-18T19:00:00.001Z:ol","key":["kyk:2011-10-18T19:00:00.001Z:ol","outline: jbjordan"],"value":{"_id":"kyk:2011-10-18T19:00:00.001Z:ol","_rev":"22-ff71488ca01a11ada5f926d0a6db8108","head":{"submissionTimestamp":[2011,10,18,"19:00:00.001Z"],"bcvRange":["Deut",1,1,"Deut",34,12],"author":{"guid":"kyk:2011-06-06T19:00:00.002Z:ps","authorShortname":"jbjordan"},"submittedBy":{"guid":"kyk:1974-12-23T03:22:15.481Z:ps"},"source":{"guid":"kyk:2011-10-18T19:00:00.002Z:sr","details":"p. 57"},"title":"Covenant/Re-creation Pattern","ScriptureRange":"Deuteronomy 1:1-34:12","contentType":"outline"},"body":{"concepts":[{"content":"Taking Hold – Transcendence – Initiation, 1:1-5"},{"content":"Historical Overview – Breakdown and Renewal of Order, 1:6-4:43"},{"content":"Stipulations – Given with view to the coming Distribution of the Land, 4:44-26:19"},{"content":"Sanctions – Witnesses, 27-30"},{"content":"Succession – Rest – Enhancements– Continuity, 31-34."}]}}},
{"id":"kyk:2011-10-18T19:00:00.002Z:sr","key":["kyk:2011-10-18T19:00:00.002Z:sr","source: Covenant Sequence In Leviticus and Deuteronomy"],"value":{"_id":"kyk:2011-10-18T19:00:00.002Z:sr","_rev":"5-7545b66aff99f72a8032277624357f4c","head":{"contentType":"sourceProfile"},"media":"book","details":"Covenant Sequence In Leviticus and Deuteronomy","website":"","publisherDetails":""}},
{"id":"kyk:2011-10-20T19:00:00.001Z:ol","key":["kyk:2011-10-20T19:00:00.001Z:ol","outline: jbjordan"],"value":{"_id":"kyk:2011-10-20T19:00:00.001Z:ol","_rev":"17-8b4c5d21a39d10ab4671d745e62cc7cc","head":{"submissionTimestamp":[2011,10,20,"19:00:00.001Z"],"bcvRange":["Deut",1,6,"Deut",4,43],"author":{"guid":"kyk:2011-06-06T19:00:00.002Z:ps","authorShortname":"jbjordan"},"submittedBy":{"guid":"kyk:1974-12-23T03:22:15.481Z:ps"},"source":{"guid":"kyk:2011-10-18T19:00:00.002Z:sr","details":"p. 59"},"title":"Covenant Breakdown and Renewal","ScriptureRange":"Deuteronomy 1:6-4:43","contentType":"outline"},"body":{"concepts":[{"content":"Covenant Breakdown, 1:6-46","concepts":[{"content":"God initiated covenant, 1:6-8"},{"content":"New socio-political order, 1:9-18"},{"content":"Disobedience to stipulations, rejection of distributed grant, 1:19-33"},{"content":"Judgment: the people to be restructured, 1:34-40"},{"content":"Loss of inheritance, 1:41-46"}]},{"content":"Covenant Renewal, 2:1-4:40","concepts":[{"content":"God initiates all actions in 2:1-3:11"},{"content":"Historical prelude to the distribution of the land:","concepts":[{"content":"Esau, 2:1-8"},{"content":"Moab, 2:9-13 (defeat of giant is condition for inheritance)"},{"content":"Ammon, 2:14-23"},{"content":"Sihon, 2:24-37"},{"content":"Og, 3:1-11 (giant finally defeated)"}]},{"content":"Distribution of land and accompanying rules, 3:12-4:24"},{"content":"Sanctions, 4:25-31"},{"content":"Continuity: think back and pass it on, 4:32-40"}]},{"content":"Moses sets up the essential geographical/hierarchical order for the land, 4:41-43"}]}}},
{"id":"kyk:2012-05-23T19:01:53.713Z:ol","key":["kyk:2012-05-23T19:01:53.713Z:ol","chiasm: pjleithart"],"value":{"_id":"kyk:2012-05-23T19:01:53.713Z:ol","_rev":"4-2a1e4a9d425942fbf981a35744796507","head":{"contentType":"chiasm","title":"Don't neglect Levites","ScriptureRange":"Deut 12:1-32","submissionTimestamp":[2012,5,23,"19:01:53.713Z"],"author":{"guid":"kyk:2012-05-23T19:05:05.116Z:ps","authorShortname":"pjleithart"},"modifiedTimestamp":[2012,5,23,"19:08:54.451Z"],"source":{"details":"p. 35","website":"","guid":"kyk:2012-05-23T19:08:13.954Z:sr"},"submittedBy":{"guid":"kyk:1974-12-23T03:22:15.481Z:ps"}},"body":{"concepts":[{"content":"Observe carefully in land, v. 1"},{"content":"Destroy Canaanite worship, vv. 2-4"},{"content":"Worship at central sanctuary, vv. 5-14"},{"content":"Meat and blood, vv. 15-18"},{"content":"Don't neglect Levites, v. 19"},{"content":"Meat and blood, vv. 20-25 (\"well with you\"' \"do what is right,\" v. 25)"},{"content":"Worship at central sanctuary, vv. 26-28 (\"well with you; \"do what is right,\" v.28)"},{"content":"Beware Canaanite worship, vv. 29-31"},{"content":"Be careful to do commands, v.32"}]}}},
{"id":"kyk:2012-05-23T19:05:05.116Z:ps","key":["kyk:2012-05-23T19:05:05.116Z:ps","person: Leithart, Peter"],"value":{"_id":"kyk:2012-05-23T19:05:05.116Z:ps","_rev":"1-22ae6982b85cdfbad3439a4b373917c2","name":{"title":"Dr.","first":"Peter","middle":"J.","last":"Leithart","suffix":""},"organization":{"name":"","website":"www.leithart.com"},"head":{"contentType":"personProfile"}}},
{"id":"kyk:2012-05-23T19:08:13.954Z:sr","key":["kyk:2012-05-23T19:08:13.954Z:sr","source: A House For My Name"],"value":{"_id":"kyk:2012-05-23T19:08:13.954Z:sr","_rev":"1-d979ff939abf7f00e9a56b6237952787","media":"book","details":"A House For My Name","website":"","publisherDetails":"www.canonpress.com","head":{"contentType":"sourceProfile"}}},
{"id":"kyk:2012-05-24T17:14:10.438Z:ol","key":["kyk:2012-05-24T17:14:10.438Z:ol","chiasm: gwenham"],"value":{"_id":"kyk:2012-05-24T17:14:10.438Z:ol","_rev":"3-270b8f8899efd9b8e8bae3a44bf48381","head":{"contentType":"chiasm","title":"Babel","ScriptureRange":"Gen 11:1-9","submissionTimestamp":[2012,5,24,"17:14:10.438Z"],"source":{"details":"p. 235","website":"","guid":"kyk:2012-05-25T15:51:49.181Z:sr"},"modifiedTimestamp":[2012,5,25,"15:54:18.738Z"],"author":{"guid":"kyk:2012-05-25T15:50:38.980Z:ps","authorShortname":"gwenham"},"submittedBy":{"guid":"kyk:1974-12-23T03:22:15.481Z:ps"}},"body":{"concepts":[{"content":"The whole earth has one language (v.1)"},{"content":"Settled there (v.2)"},{"content":"Said to one another (v.3)"},{"content":"Come, let us make bricks (v.3)"},{"content":"Let us build (v.4)"},{"content":"City and tower (v.4)"},{"content":"Lord came down (v.5)"},{"content":"City and tower (v.5)"},{"content":"That man had built (v.7)"},{"content":"Come, let us confuse (v.7)"},{"content":"One another's speech (v.7)"},{"content":"Scattered from there (v.8)"},{"content":"Confused language of the whole earth (v.9)"}]}}},
{"id":"kyk:2012-05-25T15:50:38.980Z:ps","key":["kyk:2012-05-25T15:50:38.980Z:ps","person: Wenham, Gordon"],"value":{"_id":"kyk:2012-05-25T15:50:38.980Z:ps","_rev":"1-1b63752fd6952d7a301baf2d34f9300d","name":{"title":"","first":"Gordon","middle":"","last":"Wenham","suffix":""},"organization":{"name":"","website":""},"head":{"contentType":"personProfile"}}},
{"id":"kyk:2012-05-25T15:51:49.181Z:sr","key":["kyk:2012-05-25T15:51:49.181Z:sr","source: Genesis 1-15"],"value":{"_id":"kyk:2012-05-25T15:51:49.181Z:sr","_rev":"1-2de89151c4d4e41168e42e5173b0653e","media":"","details":"Genesis 1-15","website":"","publisherDetails":"","head":{"contentType":"sourceProfile"}}},
{"id":"kyk:2012-05-26T08:23:13Z:ol","key":["kyk:2012-05-26T08:23:13Z:ol","chiasm: pjleithart"],"value":{"_id":"kyk:2012-05-26T08:23:13Z:ol","_rev":"4-0c3134cab61db284d2726e6da46ffc2d","head":{"contentType":"chiasm","title":"The prosperity of Jacob's house","ScriptureRange":"Gen 28:10-32:32","author":{"guid":"kyk:2012-05-23T19:05:05.116Z:ps","authorShortname":"pjleithart"},"submittedBy":{"guid":"kyk:1974-12-23T03:22:15.481Z:ps"},"submissionTimestamp":[2012,5,26,"08:23:13Z"],"source":{"details":"p. 63","website":"","guid":"kyk:2012-05-23T19:08:13.954Z:sr"},"modifiedTimestamp":[2012,5,26,"12:12:49.428Z"]},"body":{"concepts":[{"content":"Jacob fleeing land; God appears at Bethel (28:10-22)"},{"content":"Jacob arrives at Haran, marries (29:1-30)"},{"content":"Jacob's children (29:31-30:24)"},{"content":"Jacob's flocks (30:25-43)"},{"content":"Jacob leaves Haran (31:1-55)"},{"content":"Jacob reentering land; God appears at Peniel (32:1-32)"}]}}},
{"id":"kyk:2012-05-26T12:22:19.659Z:ol","key":["kyk:2012-05-26T12:22:19.659Z:ol","chiasm: dadorsey"],"value":{"_id":"kyk:2012-05-26T12:22:19.659Z:ol","_rev":"4-4189dfd6f24b07c41aa8aebfd68e01c9","head":{"contentType":"chiasm","title":"The Covenant of Abraham","ScriptureRange":"Gen 12:1-21:7","submissionTimestamp":[2012,5,26,"12:22:19.659Z"],"author":{"guid":"kyk:2012-05-26T12:29:27.509Z:ps","authorShortname":"dadorsey"},"submittedBy":{"guid":"kyk:1974-12-23T03:22:15.481Z:ps"},"source":{"details":"p. 56","website":"","guid":"kyk:2012-05-26T12:37:11.954Z:sr"},"modifiedTimestamp":[2012,6,17,"20:03:38.622Z"]},"body":{"concepts":[{"content":"Promise of seed, 12:1-9"},{"content":"Abram in Egypt, 12:10-20"},{"content":"Lot settles in Sodom, 13:1-18"},{"content":"Abram intervenes on behalf of Lot, 14:1-24"},{"content":"Promise of a son, 15:1-21"},{"content":"Ishmael's birth, 16:1-16"},{"content":"Covenant of circumcision, 17:1-17"},{"content":"Ishmael and Abraham circumcised, 17:22-27"},{"content":"Promise of a son, 18:1-15"},{"content":"Abraham intercedes on behalf of Sodom and Lot, 18:16-33"},{"content":"Lot flees from Sodom, 19:1-38"},{"content":"Abraham in Gerar, 20:1-18"},{"content":"Birth of Isaac, 21:1-7"}]}}},
{"id":"kyk:2012-05-26T12:29:27.509Z:ps","key":["kyk:2012-05-26T12:29:27.509Z:ps","person: Dorsey, David"],"value":{"_id":"kyk:2012-05-26T12:29:27.509Z:ps","_rev":"1-8857066c32bc7e88e4d66d1d87bd50ff","name":{"title":"","first":"David","middle":"A","last":"Dorsey","suffix":""},"organization":{"name":"","website":""},"head":{"contentType":"personProfile"}}},
{"id":"kyk:2012-05-26T12:37:11.954Z:sr","key":["kyk:2012-05-26T12:37:11.954Z:sr","source: The Literary Structure of the Old Testament: A Commentary on Gen"],"value":{"_id":"kyk:2012-05-26T12:37:11.954Z:sr","_rev":"1-65970e247dbc1f236fbbf7743b2116cc","media":"book","details":"The Literary Structure of the Old Testament: A Commentary on Genesis-Malachi","website":"","publisherDetails":"Grand Rapids, MI: Baker, 1999","head":{"contentType":"sourceProfile"}}},
{"id":"kyk:2012-05-26T18:56:34.722Z:ol","key":["kyk:2012-05-26T18:56:34.722Z:ol","chiasm: gwenham"],"value":{"_id":"kyk:2012-05-26T18:56:34.722Z:ol","_rev":"2-5c5088d45c75b0c3f7c8371ec053a81b","head":{"contentType":"chiasm","title":"Yahweh's Third Speech (the sign of the covenant)","ScriptureRange":"Gen 17:1-25","submissionTimestamp":[2012,5,26,"18:56:34.722Z"],"author":{"guid":"kyk:2012-05-25T15:50:38.980Z:ps","authorShortname":"gwenham"},"submittedBy":{"guid":"kyk:1974-12-23T03:22:15.481Z:ps"},"source":{"details":"pp. 17-18","website":"","guid":"kyk:2012-05-26T19:05:10.812Z:sr"},"modifiedTimestamp":[2012,5,26,"19:07:04.484Z"]},"body":{"concepts":[{"content":"Abraham is 99 (v.1a)"},{"content":"Yahweh appears (v.1b)"},{"content":"Yahweh's first speech (vv. 1b-2)"},{"content":"Abraham falls on his face (v.3a)"},{"content":"Second speech: name change, nations, kings (vv. 4-8)"},{"content":"Third speech: the sign of the covenant (vv. 9-14)"},{"content":"Fourth speech: name change, nations, kings (vv. 15-16)"},{"content":"Abraham falls on his face (v.17)"},{"content":"Fifth speech (vv. 19-21)"},{"content":"Yahweh departs (v.22)"},{"content":"Abraham is 99, Ishmael is 13 (vv. 24-25)"}]}}},
{"id":"kyk:2012-05-26T19:05:10.812Z:sr","key":["kyk:2012-05-26T19:05:10.812Z:sr","source: Genesis 16-50 [Word Biblical Commentary #2]"],"value":{"_id":"kyk:2012-05-26T19:05:10.812Z:sr","_rev":"1-c719c3c14404c8967b8b7aba52981e42","media":"book","details":"Genesis 16-50 [Word Biblical Commentary #2]","website":"","publisherDetails":"Waco, TX: Word, 1994","head":{"contentType":"sourceProfile"}}},
{"id":"kyk:2012-05-28T18:54:44.272Z:ol","key":["kyk:2012-05-28T18:54:44.272Z:ol","chiasm: sferguson"],"value":{"_id":"kyk:2012-05-28T18:54:44.272Z:ol","_rev":"2-dbeffe6d4f17e294b4039059a8152305","head":{"contentType":"chiasm","title":"The Suffering Servant","ScriptureRange":"Isaiah 52:13-53:12","submissionTimestamp":[2012,5,28,"18:54:44.272Z"],"author":{"guid":"kyk:2012-05-28T18:55:41.431Z:ps","authorShortname":"sferguson"},"submittedBy":{"guid":"kyk:1974-12-23T03:22:15.481Z:ps"},"source":{"details":"p. 105, Ch. 7, \"Christ, the Sin-Bearer\"","website":"","guid":"kyk:2012-05-28T19:02:03.431Z:sr"},"modifiedTimestamp":[2012,5,28,"19:02:23.649Z"]},"body":{"concepts":[{"content":"Exaltation following his suffering (52:13-15)"},{"content":"The servant's multifaceted suffering (53:1-3)"},{"content":"The significance of his suffering: wounded for our transgressions (53:4-6)"},{"content":"The servant's multifaceted suffering (53:7-9)"},{"content":"Exaltation following his suffering (53:10-12)"}]}}},
{"id":"kyk:2012-05-28T18:55:41.431Z:ps","key":["kyk:2012-05-28T18:55:41.431Z:ps","person: Ferguson, Sinclair"],"value":{"_id":"kyk:2012-05-28T18:55:41.431Z:ps","_rev":"1-55a2d70a7e0318df141769cbb6a84b1a","name":{"title":"","first":"Sinclair","middle":"","last":"Ferguson","suffix":""},"organization":{"name":"","website":""},"head":{"contentType":"personProfile"}}},
{"id":"kyk:2012-05-28T19:02:03.431Z:sr","key":["kyk:2012-05-28T19:02:03.431Z:sr","source: Atonement"],"value":{"_id":"kyk:2012-05-28T19:02:03.431Z:sr","_rev":"1-dff251e288efd8e42653b0d49400649a","media":"book","details":"Atonement","website":"","publisherDetails":"2010, P&R Publishing Co.","head":{"contentType":"sourceProfile"}}},
{"id":"kyk:2012-05-28T19:13:55.739Z:ol","key":["kyk:2012-05-28T19:13:55.739Z:ol","outline: jbjordan"],"value":{"_id":"kyk:2012-05-28T19:13:55.739Z:ol","_rev":"2-c7b9fc162582d58eb97b8821ddf4e677","head":{"contentType":"outline","title":"The Seven Eras of Church History","ScriptureRange":"Revelation 2-3","submissionTimestamp":[2012,5,28,"19:13:55.739Z"],"author":{"guid":"kyk:2011-06-06T19:00:00.002Z:ps","authorShortname":"jbjordan"},"submittedBy":{"guid":"kyk:1974-12-23T03:22:15.481Z:ps"},"source":{"details":"p. 8-9, Introduction","website":"","guid":"kyk:2012-05-28T19:16:54.047Z:sr"},"modifiedTimestamp":[2012,5,28,"19:17:12.143Z"]},"body":{"concepts":[{"content":"Ephesus — \"garden\" — Creation to Abram"},{"content":"Smyrna — \"prison\" — Abram to Moses"},{"content":"Pergamos — \"wilderness\" — Moses to David"},{"content":"Thyatira — \"kingdom\" — David to Elijah"},{"content":"Sardis — \"remnant\" — Elijah to Jeremiah"},{"content":"Philadelphia — \"world witness\" Daniel to the Maccabees"},{"content":"Laodicea — \"communion with God\" — Maccabees to Jesus"}]}}},
{"id":"kyk:2012-05-28T19:16:54.047Z:sr","key":["kyk:2012-05-28T19:16:54.047Z:sr","source: Crisis, Opportunity, and the Christian future"],"value":{"_id":"kyk:2012-05-28T19:16:54.047Z:sr","_rev":"1-f2fc0e62e291565ba8c8b703850d6271","media":"book","details":"Crisis, Opportunity, and the Christian future","website":"","publisherDetails":"Athanasius Press","head":{"contentType":"sourceProfile"}}},
{"id":"kyk:2012-05-28T19:46:44.832Z:ol","key":["kyk:2012-05-28T19:46:44.832Z:ol","chiasm: edpyle"],"value":{"_id":"kyk:2012-05-28T19:46:44.832Z:ol","_rev":"1-c467a94bbe2ab3ed33c60e5c95108be1","head":{"contentType":"chiasm","title":"The grace of God","ScriptureRange":"1 Cor 15:10","author":{"guid":"kyk:1974-12-23T03:22:15.481Z:ps","authorShortname":"edpyle"},"submittedBy":{"guid":"kyk:1974-12-23T03:22:15.481Z:ps"},"source":{"details":"","website":"","guid":"kyk:1845-12-23T03:22:15.481Z:sr"},"submissionTimestamp":[2012,5,28,"19:46:44.832Z"]},"body":{"concepts":[{"content":"by the grace of God I am what I am"},{"content":"his grace toward me was not in vain"},{"content":"I worked harder than any"},{"content":"not I but the grace of God with me"}]}}},
{"id":"kyk:2012-05-29T18:33:14.533Z:ol","key":["kyk:2012-05-29T18:33:14.533Z:ol","chiasm: dadorsey"],"value":{"_id":"kyk:2012-05-29T18:33:14.533Z:ol","_rev":"2-a629a2f422fa1f0e75fd3db0324d34c6","head":{"contentType":"chiasm","title":"Aaron's status as priest","ScriptureRange":"Numbers 10:11-21:20","author":{"guid":"kyk:2012-05-26T12:29:27.509Z:ps","authorShortname":"dadorsey"},"submittedBy":{"guid":"kyk:1974-12-23T03:22:15.481Z:ps"},"source":{"details":"p. 85","website":"","guid":"kyk:2012-05-26T12:37:11.954Z:sr"},"submissionTimestamp":[2012,5,29,"18:33:14.533Z"],"modifiedTimestamp":[2012,5,29,"18:43:31.155Z"]},"body":{"concepts":[{"content":"Journey begins from Sinai (10:11-36)"},{"content":"Complaints about hardship, manna, no food (11:1-35)"},{"content":"Miriam punished for her sin (12:1-16)"},{"content":"Rebellion at Kadesh (13:1-14:45)"},{"content":"Ritual regulations (15:1-36)"},{"content":"Rebellion against Aaron (15:37-16:50)"},{"content":"Aaron's rod (17:1-13)"},{"content":"Duties and privileges of priests (18:1-32)"},{"content":"Ritual regulations (19:1-22)"},{"content":"Rebellion of Moses and Aaron (20:1-21)"},{"content":"Aaron dies (20:22-29)"},{"content":"Complaints about hardship, manna, no food (21:4-9)"},{"content":"Journey ends; camped on plains of Moab (21:10-20)"}]}}},
{"id":"kyk:2012-06-07T11:57:50.375Z:ol","key":["kyk:2012-06-07T11:57:50.375Z:ol","chiasm: akay"],"value":{"_id":"kyk:2012-06-07T11:57:50.375Z:ol","_rev":"6-9b7fb005219ce5f82981b4f0a97f8209","head":{"contentType":"chiasm","title":"Looking unto Jesus","ScriptureRange":"Psalm 123:1-4","submissionTimestamp":[2012,6,7,"11:57:50.375Z"],"source":{"details":"sermon","website":"","guid":""},"modifiedTimestamp":[2012,6,12,"18:34:52.160Z"],"submittedBy":{"guid":"kyk:2012-06-07T16:58:26.738Z:ps"},"author":{"guid":"kyk:2012-06-07T16:58:26.738Z:ps","authorShortname":"akay"}},"body":{"concepts":[{"content":"I look up (1a)"},{"content":"Yahweh sits to judge righteously (1b)"},{"content":"We look humbly for grace (2a)"},{"content":"Handmaid / Bride (2b)"},{"content":"We look not to our enemies but to Yahweh (2c)"},{"content":"We plead for the grace of our Bridegroom (3a)"},{"content":"They reward us with contempt (3b)"},{"content":"They sit to scoff (4a)"},{"content":"They look down (4b)"}]}}},
{"id":"kyk:2012-06-07T16:58:26.738Z:ps","key":["kyk:2012-06-07T16:58:26.738Z:ps","person: Kay, Arthur"],"value":{"_id":"kyk:2012-06-07T16:58:26.738Z:ps","_rev":"1-3200c4e5c7fcbf6bd7e633a2d2fa6c66","name":{"title":"Rev.","first":"Arthur","middle":"","last":"Kay","suffix":""},"organization":{"name":"","website":""},"head":{"contentType":"personProfile"}}},
{"id":"kyk:2012-06-09T19:35:29.832Z:ol","key":["kyk:2012-06-09T19:35:29.832Z:ol","chiasm: akay"],"value":{"_id":"kyk:2012-06-09T19:35:29.832Z:ol","_rev":"2-6b5263fd9c18545bea14e5b32e2d2725","head":{"contentType":"chiasm","title":"Vengeance belongs to Yahweh","ScriptureRange":"Psalm 120:1-7","author":{"guid":"kyk:2012-06-07T16:58:26.738Z:ps","authorShortname":"akay"},"submittedBy":{"guid":"kyk:2012-06-07T16:58:26.738Z:ps"},"submissionTimestamp":[2012,6,9,"19:35:29.832Z"],"source":{"details":"","website":"","guid":""},"modifiedTimestamp":[2012,6,10,"17:58:52.532Z"]},"body":{"concepts":[{"content":"In my trouble I cried to YHWH, and He heard me."},{"content":"Deliver my soul, O YHWH, from lying lips, from a deceitful tongue."},{"content":"What shall be given to you? Or what shall be done to you, O false tongue?"},{"content":"Sharp arrows of the Mighty, with coals of broom."},{"content":"Woe is me, that I live in Mesech; I dwell in the tents of Kedar!"},{"content":"My soul has long dwelt with a hater of peace."},{"content":"I am for peace; but when I speak, they are for war."}]}}},
{"id":"kyk:2012-06-24T17:24:42.387Z:ps","key":["kyk:2012-06-24T17:24:42.387Z:ps","person: Kerr, Kelly"],"value":{"_id":"kyk:2012-06-24T17:24:42.387Z:ps","_rev":"1-90b68a8c6e2cec409e380b0bbec80789","name":{"title":"","first":"Kelly","middle":"","last":"Kerr","suffix":""},"organization":{"name":"","website":""},"head":{"contentType":"personProfile"}}},
{"id":"kyk:2012-06-24T17:27:37.020Z:ol","key":["kyk:2012-06-24T17:27:37.020Z:ol","chiasm: kkerr"],"value":{"_id":"kyk:2012-06-24T17:27:37.020Z:ol","_rev":"4-617e435584af405da6b974f3b52887cc","head":{"contentType":"chiasm","title":"Mark Chiasm","ScriptureRange":"Mark 1:1-16:20","submittedBy":{"guid":"kyk:2012-06-24T17:24:42.387Z:ps"},"submissionTimestamp":[2012,6,24,"17:27:37.020Z"],"author":{"guid":"kyk:2012-06-24T17:24:42.387Z:ps","authorShortname":"kkerr"},"source":{"details":"","website":"","guid":"kyk:2011-06-18T18:47:27.948Z:sr"},"modifiedTimestamp":[2012,7,1,"17:27:18.842Z"]},"body":{"concepts":[{"content":"Jesus baptized & begins his ministry (Mark 1:1-15)"},{"content":"Jesus calls Peter/Andrew & James/John (Mk 1:16-20)"},{"content":"Jesus heals a man with a demon (1:21-28)"},{"content":"Jesus lifts up Peter's mother-in-law/many gathered at the door (1:29-34)"},{"content":"Jesus prays & tells leper to present himself to the priest with the offering/Jesus charged with blasphemy (1:35-2:12)"},{"content":"Jesus reclining at table/questioned about fasting/Sabbath/plot to kill Jesus (2:13-3:12) "},{"content":"Teaching disciples/Jesus' family tries to seize him (3:13-21)"},{"content":"Blasphemy against the Spirit (3:22-30)"},{"content":"Parables (3:31-4:34)"},{"content":"Jesus calms storm/heals a woman, girl & man with demon (5)"},{"content":"Jesus not doing mighty acts in Nazareth (6:1-6)"},{"content":"Jesus & disciples heal/death of John the Baptist (6:7-29)"},{"content":"Jesus feeds 5,000 (6:30-44)"},{"content":"Disciples' hard heart/Jesus heals the sick(6:45-56)"},{"content":"Defilement and the traditions of men (7:1-23)"},{"content":"Syrophoenician's faith/Jesus heals a man (7:24-37)"},{"content":"Jesus feeds 4,000 & its lesson (8:1-21)"},{"content":"Jesus heals blind man & foretells death & resurrection (8:22-9:1)"},{"content":"Jesus transfigured (9:2-13)"},{"content":"Jesus heals boy with unclean spirit (9:14-32)"},{"content":"Illustrations of parables (9:33-10:52)"},{"content":"Triumphal entry/the temple blasphemes God (11:1-12:44)"},{"content":"Teaching disciples/family will turn against family members (13)"},{"content":"Jesus reclining at table/Lord’s Supper/plot to kill Jesus (14:1-31)"},{"content":"Jesus prays & he is presented to the high priest and offers himself/charged with blasphemy (14:32-15:47)"},{"content":"Jesus is resurrected/Marys at the stone of the tomb (16:1-8)"},{"content":"Jesus appears to Mary Magdalene, who had 7 demons (16:9-11)"},{"content":"Jesus appears to 2 of his disciples (16:12-13)"},{"content":"Jesus commissions his disciples to baptize & ascends to heaven (16:14-20)"}]}}},
{"id":"kyk:2012-07-16T13:50:48.481Z:ol","key":["kyk:2012-07-16T13:50:48.481Z:ol","panel: pjleithart"],"value":{"_id":"kyk:2012-07-16T13:50:48.481Z:ol","_rev":"3-53e9195e20f9d6118476eb28ff070ab1","head":{"contentType":"panel","title":"Dividing & Filling of God's three-story house","ScriptureRange":"Genesis 1","contentParams":{"repeat":4,"header":true},"submissionTimestamp":[2012,7,16,"13:50:48.481Z"],"modifiedTimestamp":[2012,7,23,"18:15:31.795Z"],"author":{"guid":"kyk:2012-05-23T19:05:05.116Z:ps","authorShortname":"pjleithart"},"submittedBy":{"guid":"kyk:1974-12-23T03:22:15.481Z:ps"},"source":{"details":"p. 45","website":"","guid":"kyk:2012-05-23T19:08:13.954Z:sr"}},"body":{"concepts":[{"content":"Dividing"},{"content":"Day 1: Light/dark"},{"content":"Day 2: Waters above/below"},{"content":"Day 3: Waters/land"},{"content":"Filling"},{"content":"Day 4: Sun, moon, stars"},{"content":"Day 5: Birds and fish"},{"content":"Day 6: Land animals and man"},{"content":"Day 7: Sabbath"}]}}},
{"id":"kyk:2012-08-11T13:56:27.048Z:ol","key":["kyk:2012-08-11T13:56:27.048Z:ol","panel: pjleithart"],"value":{"_id":"kyk:2012-08-11T13:56:27.048Z:ol","_rev":"4-f5e815bd0b448b35c18f26be665ed67b","head":{"contentType":"panel","title":"The sign of the covenant","ScriptureRange":"Genesis 17:1-27","contentParams":{"repeat":5,"header":false},"submissionTimestamp":[2012,8,11,"13:56:27.048Z"],"author":{"guid":"kyk:2012-05-23T19:05:05.116Z:ps","authorShortname":"pjleithart"},"submittedBy":{"guid":"kyk:1974-12-23T03:22:15.481Z:ps"},"source":{"details":"p. 69","website":"","guid":"kyk:2012-05-23T19:08:13.954Z:sr"},"modifiedTimestamp":[2012,8,11,"14:02:34.306Z"]},"body":{"concepts":[{"content":"vv. 1-2 Yahweh promises to multiply"},{"content":"v. 3 Abram falls on his face"},{"content":"vv. 4-6 Abraham father of nations"},{"content":"v. 7 Yahweh will carry out oath"},{"content":"vv. 9-14 Sign of the covenant"},{"content":"v. 16 Yahweh promises to bless Sarai"},{"content":"vv. 17-18 Abraham falls on his face"},{"content":"v. 19 Sarah mother of Isaac"},{"content":"vv. 19-21 Yahweh will carry out oath"},{"content":"vv. 23-27 Sign of the covenant"}]}}},
{"id":"kyk:2012-08-11T14:12:18.150Z:ol","key":["kyk:2012-08-11T14:12:18.150Z:ol","panel: pjleithart"],"value":{"_id":"kyk:2012-08-11T14:12:18.150Z:ol","_rev":"4-d002570f31ee406aab1f7fb0bac83aba","head":{"contentType":"panel","title":"Scattered","ScriptureRange":"Genesis 11:1-10","contentParams":{"repeat":6,"header":false},"submissionTimestamp":[2012,8,11,"14:12:18.150Z"],"modifiedTimestamp":[2012,8,11,"14:18:45.215Z"],"author":{"guid":"kyk:2012-05-23T19:05:05.116Z:ps","authorShortname":"pjleithart"},"submittedBy":{"guid":"kyk:1974-12-23T03:22:15.481Z:ps"},"source":{"details":"p. 67","website":"","guid":"kyk:2012-05-23T19:08:13.954Z:sr"}},"body":{"concepts":[{"content":"v. 1 one language / one kind of speech"},{"content":"v. 2 there"},{"content":"v. 3 each other"},{"content":"v. 4 build a city"},{"content":"v. 5 name"},{"content":"v. 5 scattered"},{"content":"v. 6 one people / one language"},{"content":"v. 7 there"},{"content":"v. 7 each other"},{"content":"v. 8 building a city"},{"content":"v. 9 its name"},{"content":"v. 10 scattered"}]}}},
{"id":"kyk:2012-08-11T14:23:53.058Z:ol","key":["kyk:2012-08-11T14:23:53.058Z:ol","panel: pjleithart"],"value":{"_id":"kyk:2012-08-11T14:23:53.058Z:ol","_rev":"3-0f6cd7a19bd6cb3d5aacb78b85070838","head":{"contentType":"panel","title":"Tabernacle \"house\"","ScriptureRange":"","contentParams":{"repeat":4,"header":true},"submissionTimestamp":[2012,8,11,"14:23:53.058Z"],"modifiedTimestamp":[2012,8,11,"14:28:08.943Z"],"author":{"guid":"kyk:2012-05-23T19:05:05.116Z:ps","authorShortname":"pjleithart"},"submittedBy":{"guid":"kyk:1974-12-23T03:22:15.481Z:ps"},"source":{"details":"p. 84","website":"","guid":"kyk:2012-05-23T19:08:13.954Z:sr"}},"body":{"concepts":[{"content":"Tabernacle"},{"content":"Courtyard"},{"content":"Holy Place"},{"content":"Most Holy Place"},{"content":"House"},{"content":"\"Kitchen\""},{"content":"\"Living Room\""},{"content":"\"Throne Room\""},{"content":"Sinai"},{"content":"Base (people)"},{"content":"Middle (elders)"},{"content":"Top (Moses)"},{"content":"Israel"},{"content":"People"},{"content":"Priests"},{"content":"High Priest"}]}}},
{"id":"kyk:2012-08-13T04:37:27.482Z:ps","key":["kyk:2012-08-13T04:37:27.482Z:ps","person: Capezza, Rick"],"value":{"_id":"kyk:2012-08-13T04:37:27.482Z:ps","_rev":"1-9896a821c00c413fb9aedf67615877fc","name":{"title":"Dr.","first":"Rick","middle":"","last":"Capezza","suffix":""},"organization":{"name":"Chaplain, St. Luke's Regional Medical Center","website":""},"head":{"contentType":"personProfile"}}},
{"id":"kyk:2012-08-13T04:40:38.085Z:ol","key":["kyk:2012-08-13T04:40:38.085Z:ol","chiasm: rcapezza"],"value":{"_id":"kyk:2012-08-13T04:40:38.085Z:ol","_rev":"4-9438adde1f70809ab45267f4971d241d","head":{"contentType":"chiasm","title":"","ScriptureRange":"Ps. 50:1-23","submissionTimestamp":[2012,8,12,"04:40:38.085Z"],"author":{"guid":"kyk:2012-08-13T04:37:27.482Z:ps","authorShortname":"rcapezza"},"source":{"details":"","website":"","guid":""},"modifiedTimestamp":[2012,8,12,"04:47:03.342Z"],"submittedBy":{"guid":"kyk:2012-08-13T04:37:27.482Z:ps"}},"body":{"concepts":[{"content":"El, Elohim, Yahweh (1)"},{"content":"“he does not keep silence” (3)"},{"content":"“I will testify against you” (7)"},{"content":"“Not for your sacrifices do I rebuke you” (8)"},{"content":"Continuous sacrifice (8)"},{"content":"Salvation (15)"},{"content":"Honor/Dishonor (15-16)"},{"content":"Apostasy (“cast my words behind you”) (17)"},{"content":"Continuous slander (20)"},{"content":"“I rebuke you” (21)"},{"content":"“[I] lay the charge before you” (21)"},{"content":"“I have been silent” (21)"},{"content":"Eloah, Elohim (22-23)"}]}}},
{"id":"kyk:2012-08-13T04:43:12.246Z:ol","key":["kyk:2012-08-13T04:43:12.246Z:ol","chiasm: rcapezza"],"value":{"_id":"kyk:2012-08-13T04:43:12.246Z:ol","_rev":"2-477390a55698905501f77fb4278ae753","head":{"contentType":"chiasm","title":"","ScriptureRange":"Ps. 50:1-6","author":{"guid":"kyk:2012-08-13T04:37:27.482Z:ps","authorShortname":"rcapezza"},"submittedBy":{"guid":"kyk:2012-08-13T04:37:27.482Z:ps"},"submissionTimestamp":[2012,8,12,"04:43:12.246Z"],"source":{"details":"","website":"","guid":""},"modifiedTimestamp":[2012,8,12,"04:43:28.327Z"]},"body":{"concepts":[{"content":"Elohim (1)"},{"content":"Earth [creation] (1)"},{"content":"\"Zion, perfection of beauty\" [cult] (2)"},{"content":"“Our God” [covenant] (3a)"},{"content":"Heavens (4a)"},{"content":"Earth (4b)"},{"content":"“his people” [covenant] (4b)"},{"content":"“ratify my covenant by sacrifice” [cult] (5)"},{"content":"Heavens [creation] (6)"},{"content":"Elohim (6)"}]}}},
{"id":"kyk:2012-08-13T04:45:05.072Z:ol","key":["kyk:2012-08-13T04:45:05.072Z:ol","chiasm: rcapezza"],"value":{"_id":"kyk:2012-08-13T04:45:05.072Z:ol","_rev":"2-b39a8450288e18d315c3f70b746e21b8","head":{"contentType":"chiasm","title":"","ScriptureRange":"Ps. 50:7-15","author":{"guid":"kyk:2012-08-13T04:37:27.482Z:ps","authorShortname":"rcapezza"},"submittedBy":{"guid":"kyk:2012-08-13T04:37:27.482Z:ps"},"submissionTimestamp":[2012,8,12,"04:45:05.072Z"],"source":{"details":"","website":"","guid":""},"modifiedTimestamp":[2012,8,12,"04:45:38.070Z"]},"body":{"concepts":[{"content":"\"I will charge you\" (7)."},{"content":"improper sacrifices (8)"},{"content":"bulls and goats (9)"},{"content":"\"mine is all life\" (10)"},{"content":"“I know all...” (11)"},{"content":"\"for mine is the world and its fullness\" (12)"},{"content":"bulls and goats (13)"},{"content":"proper sacrifices (14)"},{"content":"\"I will rescue you\" (15)"}]}}},
{"id":"kyk:2012-08-13T04:46:25.497Z:ol","key":["kyk:2012-08-13T04:46:25.497Z:ol","chiasm: rcapezza"],"value":{"_id":"kyk:2012-08-13T04:46:25.497Z:ol","_rev":"2-0492225fbfc7514bf574dad435bbab35","head":{"contentType":"chiasm","title":"","ScriptureRange":"Ps. 50:16-23","author":{"guid":"kyk:2012-08-13T04:37:27.482Z:ps","authorShortname":"rcapezza"},"submittedBy":{"guid":"kyk:2012-08-13T04:37:27.482Z:ps"},"submissionTimestamp":[2012,8,12,"04:46:25.497Z"],"source":{"details":"","website":"","guid":""},"modifiedTimestamp":[2012,8,13,"00:18:17.205Z"]},"body":{"concepts":[{"content":"Law (16)"},{"content":"\"you despise my words\" (17)"},{"content":"man delights in sin (18)"},{"content":"mouth of evil (19)"},{"content":"mouth of slander (20)"},{"content":"they imagine God is like man (21)"},{"content":"God-forgetters (22)"},{"content":"Sacrifice (23)"}]}}},
{"id":"kyk:2012-08-13T04:53:47.343Z:ol","key":["kyk:2012-08-13T04:53:47.343Z:ol","chiasm: rcapezza"],"value":{"_id":"kyk:2012-08-13T04:53:47.343Z:ol","_rev":"2-db4b119ca416134298377a94399fccbe","head":{"contentType":"chiasm","title":"","ScriptureRange":"Jonah 1:17-2:10","author":{"guid":"kyk:2012-08-13T04:37:27.482Z:ps","authorShortname":"rcapezza"},"submittedBy":{"guid":"kyk:2012-08-13T04:37:27.482Z:ps"},"submissionTimestamp":[2012,8,12,"04:53:47.343Z"],"source":{"details":"","website":"","guid":""},"modifiedTimestamp":[2012,8,12,"04:53:55.290Z"]},"body":{"concepts":[{"content":"Jonah swallowed by a fish (1:17)"},{"content":"Jonah calls on God for salvation (2:1-2)"},{"content":"Descending into the abyss (2:3-4)"},{"content":"Death and resurrection of Jonah (2:5-6)"},{"content":"Looking up at God’s temple / prayer has arisen (2:7) "},{"content":"Jonah praises God for salvation (2:8-9)"},{"content":"Jonah vomited out (2:10)"}]}}}
]};




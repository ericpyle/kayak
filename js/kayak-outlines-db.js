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
 * Or better: use Firefox->Console and expand the GET https://cloudbow.cloudant.com/kayak/_design/everything/_view/byDocId	.
 */
	var authorsAndOutlinesResponse = {
	    "total_rows": 0, "offset": 0, "rows": []
	};




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
		var getResponse;
		var dbMain;
		var exampleRows;
		function LoadPersonsAndAuthoredOutlines()
		{
			var fNeedRenderToPage = true;
			if (getResponse)
			{
				alert("here already?");
				LoadExamplesToTableCallback(getResponse);				
	      		//LoadAuthorResultsCallback(getResponse);
	      		fNeedRenderToPage = false;
			}
			
			loadDataSet(fNeedRenderToPage);
		}
		
		function loadDataSet(fNeedRenderToPage)
		{
			if (dbMain)
			{
				dbMain.get('_design/personProfiles/_view/personsAndOutlinesAuthored', 
		      			function(resp) {
		      				getResponse = resp;
		      				//$("body").data("personsAndOutlinesAuthored", getResponse);
		      				
		      				if (fNeedRenderToPage)
		      				{
			      				LoadExamplesToTableCallback(getResponse);
		      					//LoadAuthorResultsCallback(getResponse);	
		      				}		      				
				      	});
			}
			/* DEBUG ONLY */
			else 
			{
				if (!getResponse)
					getResponse = authorsAndOutlinesResponse;
				if (fNeedRenderToPage)
				{
					LoadExamplesToTableCallback(getResponse);
	      			//LoadAuthorResultsCallback(getResponse);
				}								
			}
		}
		
		function LoadExamplesToTable()
		{
			if (dbMain)
			dbMain.get('_design/outlines/_view/all', 
	      			function(resp) {
	      				LoadExamplesToTableCallback(resp);
			      	});
		}
		
		function LoadExamplesToTableCallback(resp)
		{
			$('#exampleTableBody tr').remove();
			exampleRows = resp.rows;
			for (var i=0; i < exampleRows.length; ++i) {
				var doc = exampleRows[i].value;
				if (!doc || (doc.head.contentType != "chiasm" && doc.head.contentType != "outline"))
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
				$("<tr></tr>")
					.attr("id", exampleRows[i].id)
					.addClass("exampleRow")
					.append("<td>" + doc.head.contentType + "</td>")
					.append("<td>" + formatBCVRange(doc.head.bcvRange, "") + "</td>")
					.append("<td>" + formatName(authorProfile, "") + "</td>")
					.append("<td>" + formatSource(doc, "") + "</td>")
					.append("<td>" + formatSubmissionTimestamp(doc.head.submissionTimestamp) + "</td>")
					.append("<td>" + formatName(submitterProfile, "") + "</td>")
					.appendTo('#exampleTableBody')
					.click(function(event) {
						var rowId = $(this).attr("id");
						//alert(rowId);									
						var docToLoad; 
						for(var irow=0; irow<exampleRows.length; ++irow)
						{
							if (exampleRows[irow].id == rowId)
							{
								docToLoad = exampleRows[irow].value;
								break;
							}
						}
						if (docToLoad)
							loadJSONToOutline(docToLoad); 
		  				return false;
					});
			};
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
			var source = (EmptyIfNull(profile.source.details) + 
				(profile.outline && profile.outline.source && profile.outline.source.details ? 
					", " + EmptyIfNull(profile.outline.source.details) : "" ));
			if (source.length == 0)
				return sdefault;
			else
				return source;
		}
		
		function formatName(personProfile, sdefault)
		{
			if (!personProfile)
				return sdefault;
			return (AorB(personProfile.name.title, "")) + 
				(personProfile.name.first ? " " + personProfile.name.first : "") + 
				(personProfile.name.middle? " " + personProfile.name.middle : "") + 
				(personProfile.name.last? " " + personProfile.name.last : "") + 
				(personProfile.organization && personProfile.organization.name ? ", " + personProfile.organization.name : "");
		}
		
		function formatSubmissionTimestamp(timestamp)
		{
			if (!timestamp)
				return "";
			return timestamp[1] + "/" + timestamp[2] + "/" + timestamp[0];
		}

		function EmptyIfNull(s)
		{
			return s ? s : "";
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
		
		var authorRows;
		function LoadAuthorResults()
		{
			var fNeedRenderToPage = true;
			if (getResponse)
			{				
	      		LoadAuthorResultsCallback(getResponse);
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
				var emptyProfile = CreateEmptySourceFormData()
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
			$("#authorDetailBlock").attr("style", "background: #B9C9FE;");
		}
		
		function PrepareNewAuthorSearchResults()
		{
			$('#authorResults tbody tr').remove();
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
			$('#submitterProfileResults tbody tr').remove();
			$("#authorDetailBlock").hide();
		}
		
		function LoadNewSubmitterForm()
		{
			$("#submitterProfileResults").hide();
			$("#submitterHeading").text("Enter Submitter Details");
			$("#authorDetailBlock").attr("style", "background: #B9C9FE;");
		}
		
		function PrepareNewSubmitterSearchResults()
		{
			$('#submitterProfileResults tbody tr').remove();
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
			$("#authorDetailBlock").hide();
			$("#authorResults").hide();
			$('#authorResults tbody tr').remove();
		}
		
		function PrepareNewSourceSearchResults()
		{
			$('#sourceSearchResults tbody tr').remove();
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
			$('.sourceSearchResults tbody tr').remove();
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
			var personProfile = $("[name='updateAuthorProfile']").getJSON();
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
			var keywords = removeMalformedWords($("#authorSearch").val().split(" "));
			return matchByKeywords(doc, keywords, QueryByAuthorMatches);
		}
		
		function matchBySubmitterKeywords(doc)
		{
			var keywords = removeMalformedWords($("#submitterSearch").val().split(" "));
			return matchByKeywords(doc, keywords, QueryByAuthorMatches);
		}
		
		function matchBySourceKeywords(doc)
		{
			var keywords = removeMalformedWords($("#sourceSearch").val().split(" "));
			return matchByKeywords(doc, keywords, QueryByAuthorMatches);
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
			if (matchContentType == "personProfile" && !authorRows)
				authorRows = getResponse.rows;
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
				for (var inext=i+1; inext < authorRows.length; inext++) {					
					var nextDoc = authorRows[inext].value;
					if (nextDoc && nextDoc.head.contentType != "personProfile" && 
						nextDoc.head.author && nextDoc.head.author.guid == personProfile._id)
						authoredDocs.push(nextDoc);
					else
						break;
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
		
		/*
		 * Utility
		 */
		function jq(myid) { 
   			return '#' + myid.replace(/(:|\.)/g,'\\$1');
 		}

		function LoadAuthorResultsCallback(resp, fSubmitter)
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
			authorRows = resp.rows;
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
				$("<tr></tr>")
					.attr("id", profile._id)
					.addClass("creditRow")
					.append("<td><button type='button'>*</button></td>")
					.append("<td class='personName'>" + authorColumns(profile, "name.title") + "</td>")
					.append("<td class='personName'>" + authorColumns(profile, "name.first") + "</td>")
					.append("<td class='personName'>" + authorColumns(profile, "name.middle") + "</td>")
					.append("<td class='personName'>" + authorColumns(profile, "name.last") + "</td>")
					.append("<td class='personName'>" + authorColumns(profile, "name.suffix") + "</td>")
					.append("<td>" + authorColumns(profile, "organization.name") + "</br>" +
									 authorColumns(profile, "organization.website") + "</td>")
					.append(fSubmitter ? "" : "<td>" + "" + "</td>")
					.append("<td>" + 
						(fSubmitter ? DocsSubmitted(profile, authorRows).length : DocsAuthored(profile, authorRows).length) + "</td>")
					.appendTo(fSubmitter ? "#submitterProfileResults tbody" : "#authorResults tbody")
					.click(function(event) {
						// first turn off any other selected Row.
						var parentRow = $(event.target).parent("tr");
						selectCreditRow(parentRow, fetchPersonProfile, "[name='updateAuthorProfile']");
		  				return false;
					});
			}
			$(".creditRow td button").click(function(event) {
						// first turn off any other selected Row.
						var parentRow = $(event.target).parent("td").parent("tr");
						selectCreditRow(parentRow, fetchPersonProfile, "[name='updateAuthorProfile']");
		  				return false;
					});

		};
		
		function fetchPersonProfile(idProfile)
		{
			var authorProfile = collectProfileDocs("personProfile", exampleRows, function(rowDoc){
				if (rowDoc._id == idProfile)
			    		return true;
			    	return false;
			}, true );
			return authorProfile;
		}
		
		function fetchSourceProfile(idProfile)
		{
			for (var i=0; i < exampleRows.length; ++i) {
				var doc = exampleRows[i].value;
				if (!doc)
					continue;
				var guid = idProfile.substring(0, idProfile.length - "_source".length);
				if (doc._id != guid)
					continue;
				if (doc.head.contentType == "chiasm" || doc.head.contentType == "outline")
				{
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
		
		function removeAllRowSelections()
		{
			$(".creditRowSelected").removeClass("creditRowSelected");
			// remove extra options
			$("#creditRowSelectedOptions").remove();

		}
		
		function selectCreditRow(creditRow, fetchProfile, formSelector)
		{
			var hadSelection = $(creditRow).hasClass("creditRowSelected");
			removeAllRowSelections();
			if (!hadSelection)
				$(creditRow).addClass("creditRowSelected");
			if ($(creditRow).hasClass("creditRowSelected"))
			{
				var editMode = $("#save-outline-credits").data("edit-mode");
				var editModeText = "Edit Profile";
				var editModeId = "editProfile";
				var rowHtml = "";
				if (editMode == "save-outline-submitter" || editMode == "save-outline-author")
				{
					var editLink = '<a href="#" id="'+ editModeId +'">'+ editModeText +'</a>';
					rowHtml = '<tr id="creditRowSelectedOptions"><td><button id="btnCreditOk" type="button">OK</button></td><td>' + editLink + '</td><td colspan="3"/></tr>';
					
				}
				else if (editMode == "save-outline-source")
				{
					var idProfile = $(".creditRowSelected").attr("id");
					var profile = fetchProfile(idProfile);
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
					if (idProfile == "s0_source")
						rowHtml = '<tr id="creditRowSelectedOptions"><td><button id="btnCreditOk" type="button">OK</button></td></tr>';
					else
						rowHtml = '<tr id="creditRowSelectedOptions"><td><button id="btnCreditOk" type="button">OK</button></td><td>' + editLink  + " | " + copyLink + '</td><td/></tr>';						
				}
				// add some extra options
				$(creditRow).after(rowHtml);							
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
		}
		
		function loadEditForm(idProfile, fetchProfile, editMode, formSelector)
		{
			var profile = fetchProfile(idProfile);
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
	      		LoadAuthorResultsCallback(getResponse, true);
	      		fNeedRenderToPage = false;
			}
			
			loadDataSet(fNeedRenderToPage);
		};
		
		function LoadSourceResults()
		{
			var fNeedRenderToPage = true;
			if (getResponse)
			{	
	      		LoadSourceResultsCallback(getResponse);
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
					doc.head.contentType == "outline")
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
		
		function LoadSourceResultsCallback(resp)
		{
			PrepareNewSourceSearchResults();
			if (!exampleRows)
				exampleRows = resp.rows;
			// TODO: factor in the search keywords here
			// but for now just show all
			// TODO: Add sort as well
			var profiles = findOutlinesAndUnreferencedSources(exampleRows);
			for (var i=0; i < profiles.length; ++i) {
				var doc = profiles[i];
				var authorDetails = "";
				var sourceDetails = "";
				var rowId = "";
				if (doc.head.contentType == "chiasm" || doc.head.contentType == "outline")
				{
					var authorProfile = collectProfileDocs("personProfile", exampleRows, function(rowDoc){
							if (rowDoc.head.contentType == "personProfile" && 
			    				doc.head.author && rowDoc._id == doc.head.author.guid )
						    		return true;
						    	return false;
						}, true );
					authorDetails = formatName(authorProfile, "");
					sourceDetails = formatSource(doc, "");
					rowId = doc._id;
				}
				if (doc.head.contentType == "sourceProfile")
				{
					// this is unreferenced source, so it doesn't have any associated outline details
					var sourceFormFields = CreateEmptySourceFormData();
					var combinedSource = fillCommonSourceData(sourceFormFields, doc);				
					rowId = combinedSource.source._id; 
					sourceDetails = formatCombinedSource(combinedSource, "");
				}
				// TODO: add source rows not referenced in document, findOutlinesAndUnreferencedSources
				
				// TODO: use "resp.rows" for sourceRows
				//var sourceDoc = getCommonSourceProfile(doc, sourceRows);
				
				// skip blank source
				if (sourceDetails.length == 0)
					continue;
				$("<tr></tr>")
					.attr("id", rowId + "_source")
					.addClass("creditRow")
					.append("<td><button type='button'>*</button></td>")
					.append("<td class='sourceDetails'>" + sourceDetails + "</td>")
					.append("<td>" + authorDetails + "</td>")
					.appendTo('#sourceSearchResults tbody')
					.click(function(event) {
						// first turn off any other selected Row.
						var parentRow = $(event.target).parent("tr");
						selectCreditRow(parentRow, fetchSourceProfile, "[name='updateSourceDetails']");
		  				return false;
					});
			};
			$(".creditRow td button").click(function(event) {
						// first turn off any other selected Row.
						var parentRow = $(event.target).parent("td").parent("tr");
						selectCreditRow(parentRow, fetchSourceProfile, "[name='updateSourceDetails']");
		  				return false;
					});
		}		

/**
 * JSON.stringify(mainOutline, null, '\t')
 * Find \n Replace: \\\n
 */
var authorsAndOutlinesResponse = {
	"total_rows": 9,
	"offset": 0,
	"rows": [
		{
			"id": "s0",
			"key": [ "s0", 0 ],
			"value" : 
			{
				"_id": "s0",
				"_rev":"",
				"head": { "contentType": "sourceProfile" },
				"media": "website",
				"details": "kayak",
				"website": "ericlovesallison.org/BibleTools/kayak",
				"publisherDetails" : ""
			}
		},
		{
			"id": "s1",
			"key": [ "s1", 0 ],
			"value" : 
			{
				"_id": "s1",
				"_rev":"",
				"head": { "contentType": "sourceProfile" },
				"media": "book",
				"details": "Covenant Sequence In Leviticus and Deuteronomy",
				"website": "",
				"publisherDetails" : ""
			}
		},
		{
			"id": "s2",
			"key": [ "s2", 0 ],
			"value" :
			{
				"_id": "s2",
				"_rev":"",
				"head": { "contentType": "sourceProfile" },
				"media": "website",
				"details": "Biblical Horizons",
				"website": "http://www.biblicalhorizons.com",
				"publisherDetails" : ""
			}
		},
		{
			"id": "s3",
			"key": [ "s3", 0 ],
			"value" :
			{
				"_id": "s3",
				"_rev":"",
				"head": { "contentType": "sourceProfile" },
				"media": "class",
				"details": "Redeemer Seminary, Greek Class",
				"website": "http://www.redeemerseminary.org",
				"publisherDetails" : ""
			}
		},
		{
			"id": "s4",
			"key": [ "s4", 0 ],
			"value" :
			{
				"_id": "s4",
				"_rev":"",
				"head": { "contentType": "sourceProfile" },
				"media": "email",
				"details": "Biblical Horizons Yahoogroup",
				"website": "",
				"publisherDetails" : ""
			}
		},
		{
			"id": "s5",
			"key": [ "s5", 0 ],
			"value" :
			{
				"_id": "s5",
				"_rev":"",
				"head": { "contentType": "sourceProfile" },
				"media": "book",
				"details": "Not yet referenced",
				"website": "",
				"publisherDetails" : ""
			}
		},
		{
			"id": "4d43cfb36ad257f3746df55c48000d42",
			"key": [
				"4d43cfb36ad257f3746df55c48000d42",
				0
			],
			"value": {
				"_id": "4d43cfb36ad257f3746df55c48000d42",
				"_rev": "1-5398f44a2a0cac6af8806f9cee16bcc9",
				"head": {
					"contentType": "personProfile"
				},
				"name": {
					"first": "James",
					"last": "Jordan",
					"middle": "B."
				},
				"organization": {
					"name": "Biblical Horizons",
					"website": "http://www.biblicalhorizons.com/"
				},
				"urls": [
					"http://www.facebook.com/pages/James-B-Jordan/120290590930"
				]
			}
		},
		{
			"id": "17d028b6aebef1b207d226613300290b",
			"key": [
				"4d43cfb36ad257f3746df55c48000d42",
				1,
				"jbjordan"
			],
			"value": {
				"_id": "17d028b6aebef1b207d226613300290b",
				"_rev": "16-98f02b889f27179807a232c07b1fc4af",
				"head": {
					"submissionTimestamp": [
						2011,
						6,
						6,
						"10:30:00.000Z"
					],
					"bcvRange": [
						"Matt",
						1,
						1,
						"Matt",
						28,
						20
					],
					"authorShortname": "jbjordan",
					"author": {
						"guid": "4d43cfb36ad257f3746df55c48000d42",
						"shortname": "jbjordan",
						"first": "James",
						"last": "Jordan",
						"middle": "B.",
						"organization": "Biblical Horizons"
					},
					"submittedBy": {
						"guid": "4d43cfb36ad257f3746df55c48002968",
						"first": "Eric",
						"last": "Pyle"
					},
					"source": {
						"guid": "s2",
						"name": "Biblical Horizons",
						"location": "#94",
						"date": "Apr 2007",
						"website": "http://www.biblicalhorizons.com/biblical-horizons/no-94-toward-a-chiastic-understanding-of-the-gospel-according-to-matthew-part-1/"
					},
					"title": "James B. Jordan, Biblical Horizons #94, April 1997",
					"ScriptureRange": "Matthew 1:1-28:20",
					"contentType": "chiasm",
					"scripture-version": ""
				},
				"body": {
					"concepts": [
						{
							"content": "Genealogy (past), 1:1-17"
						},
						{
							"content": "First Mary and Jesus’ birth, 1:18-25"
						},
						{
							"content": "Gifts of wealth at birth, 2:1-12"
						},
						{
							"content": "Descent into Egypt; murder of children, 2:13-21"
						},
						{
							"content": "Judea avoided, 2:22-23"
						},
						{
							"content": "Baptism of Jesus, 3:1–8:23"
						},
						{
							"content": "Crossing the sea, 8:24–11:1"
						},
						{
							"content": "John’s ministry, 11:2-19"
						},
						{
							"content": "Rejection of Jesus, 11:20-24"
						},
						{
							"content": "Gifts for the new children, 11:25-30"
						},
						{
							"content": "Attack of Pharisees, 12:1-13"
						},
						{
							"content": "Pharisees determine to kill the innocent Servant, 12:14-21"
						},
						{
							"content": "Condemnation of Pharisees, 12:22-45"
						},
						{
							"content": "Gifts for the new children, 13:1-52"
						},
						{
							"content": "Rejection of Jesus, 13:53-58"
						},
						{
							"content": "John’s death, 14:1-12"
						},
						{
							"content": "Crossing the sea, 14:13–16:12"
						},
						{
							"content": "Transfiguration of Jesus, 16:13–18:35"
						},
						{
							"content": "Judean ministry, 19:1–20:34"
						},
						{
							"content": "Ascent into Jerusalem; judgment on Jews, 21:1–27:56"
						},
						{
							"content": "Gift of wealth at death, 27:57-66"
						},
						{
							"content": "Last Marys and Jesus’ resurrection, 28:1-15"
						},
						{
							"content": "Commission (future), 28:16-20"
						}
					]
				}
			}
		},
		{
			"id": "17d028b6aebef1b207d2266133003419",
			"key": [
				"4d43cfb36ad257f3746df55c48000d42",
				1,
				"jbjordan"
			],
			"value": {
				"_id": "17d028b6aebef1b207d2266133003419",
				"_rev": "14-cce370309bbe943ceb0c29f428597319",
				"head": {
					"submissionTimestamp": [
						2011,
						10,
						18,
						"10:30:00.000Z"
					],
					"bcvRange": [
						"Deut",
						1,
						1,
						"Deut",
						34,
						12
					],
					"authorShortname": "jbjordan",
					"author": {
						"guid": "4d43cfb36ad257f3746df55c48000d42",
						"last": "Jordan",
						"first": "James",
						"middle": "B.",
						"organization": "Biblical Horizons"
					},
					"submittedBy": {
						"guid": "4d43cfb36ad257f3746df55c48002968",
						"first": "Eric",
						"last": "Pyle"
					},
					"source": {
						"guid": "s1",
						"name": "Covenant Sequence In Leviticus and Deuteronomy",
						"location": "p. 57"
					},
					"title": "Covenant/Re-creation Pattern by James Jordan in Covenant Sequence in Leviticus and Deuteronomy, p. 57",
					"ScriptureRange": "Deuteronomy 1:1-34:12",
					"contentType": "outline"
				},
				"body": {
					"concepts": [
						{
							"content": "Taking Hold – Transcendence – Initiation, 1:1-5"
						},
						{
							"content": "Historical Overview – Breakdown and Renewal of Order, 1:6-4:43"
						},
						{
							"content": "Stipulations – Given with view to the coming Distribution of the Land, 4:44-26:19"
						},
						{
							"content": "Sanctions – Witnesses, 27-30"
						},
						{
							"content": "Succession – Rest – Enhancements– Continuity, 31-34."
						}
					]
				}
			}
		},
		{
			"id": "17d028b6aebef1b207d226613300400c",
			"key": [
				"4d43cfb36ad257f3746df55c48000d42",
				1,
				"jbjordan"
			],
			"value": {
				"_id": "17d028b6aebef1b207d226613300400c",
				"_rev": "9-13b471f95678883c86d252e44b6a8f47",
				"head": {
					"submissionTimestamp": [
						2011,
						10,
						20,
						"10:30:00.000Z"
					],
					"bcvRange": [
						"Deut",
						1,
						6,
						"Deut",
						4,
						43
					],
					"authorShortname": "jbjordan",
					"author": {
						"guid": "4d43cfb36ad257f3746df55c48000d42",
						"last": "Jordan",
						"first": "James",
						"middle": "B.",
						"organization": "Biblical Horizons"
					},
					"submittedBy": {
						"guid": "4d43cfb36ad257f3746df55c48002968",
						"first": "Eric",
						"last": "Pyle"
					},
					"source": {
						"guid": "s1",
						"name": "Covenant Sequence In Leviticus and Deuteronomy",
						"location": "p. 59"
					},
					"title": "Covenant Breakdown and Renewal by James B. Jordan in Covenant Sequence in Leviticus and Deuteronomy, p. 59",
					"ScriptureRange": "Deuteronomy 1:6-4:43",
					"contentType": "outline"
				},
				"body": {
					"concepts": [
						{
							"content": "Covenant Breakdown, 1:6-46",
							"concepts": [
								{
									"content": "God initiated covenant, 1:6-8"
								},
								{
									"content": "New socio-political order, 1:9-18"
								},
								{
									"content": "Disobedience to stipulations, rejection of distributed grant, 1:19-33"
								},
								{
									"content": "Judgment: the people to be restructured, 1:34-40"
								},
								{
									"content": "Loss of inheritance, 1:41-46"
								}
							]
						},
						{
							"content": "Covenant Renewal, 2:1-4:40",
							"concepts": [
								{
									"content": "God initiates all actions in 2:1-3:11"
								},
								{
									"content": "Historical prelude to the distribution of the land:",
									"concepts": [
										{
											"content": "Esau, 2:1-8"
										},
										{
											"content": "Moab, 2:9-13 (defeat of giant is condition for inheritance)"
										},
										{
											"content": "Ammon, 2:14-23"
										},
										{
											"content": "Sihon, 2:24-37"
										},
										{
											"content": "Og, 3:1-11 (giant finally defeated)"
										}
									]
								},
								{
									"content": "Distribution of land and accompanying rules, 3:12-4:24"
								},
								{
									"content": "Sanctions, 4:25-31"
								},
								{
									"content": "Continuity: think back and pass it on, 4:32-40"
								}
							]
						},
						{
							"content": "Moses sets up the essential geographical/hierarchical order for the land, 4:41-43"
						}
					]
				}
			}
		},
		{
			"id": "4d43cfb36ad257f3746df55c48000e6d",
			"key": [
				"4d43cfb36ad257f3746df55c48000e6d",
				0
			],
			"value": {
				"_id": "4d43cfb36ad257f3746df55c48000e6d",
				"_rev": "1-233c8cea8c494c7125171a4edcc4d700",
				"head": {
					"contentType": "personProfile"
				},
				"name": {
					"title": "Prof.",
					"last": "Greene",
					"first": "Elliott",
					"middle": ""
				},
				"organization": {
					"name": "Redeemer Seminary",
					"website": "http://www.redeemerseminary.org/"
				},
				"urls": [
					"http://www.ccef.org/authors/elliott-greene",
					"http://www.redeemerseminary.org/faculty.html"
				]
			}
		},
		{
			"id": "17d028b6aebef1b207d2266133000d6a",
			"key": [
				"4d43cfb36ad257f3746df55c48000e6d",
				1,
				"egreene"
			],
			"value": {
				"_id": "17d028b6aebef1b207d2266133000d6a",
				"_rev": "13-00ea0c1449cb7a0fcd2449675eaef228",
				"head": {
					"submissionTimestamp": [
						2011,
						6,
						6,
						"10:30:00.000Z"
					],
					"bcvRange": [
						"Matt",
						7,
						6
					],
					"authorShortname": "egreene",
					"author": {
						"guid": "4d43cfb36ad257f3746df55c48000e6d",
						"title": "Prof.",
						"last": "Greene",
						"first": "Elliott",
						"middle": "",
						"organization": "WTS"
					},
					"submittedBy": {
						"guid": "4d43cfb36ad257f3746df55c48002968",
						"first": "Eric",
						"last": "Pyle"
					},
					"source": {
						"guid": "s3",
						"name": "Greek Class",
						"location": "Dallas, TX",
						"date": "1999"
					},
					"title": "Prof. Elliott Greene, WTS",
					"ScriptureRange": "Matthew 7:6",
					"contentType": "chiasm",
					"scripture-version": ""
				},
				"body": {
					"concepts": [
						{
							"content": "dogs"
						},
						{
							"content": "pigs"
						},
						{
							"content": "trample under feet"
						},
						{
							"content": "turn and tear to pieces"
						}
					]
				}
			}
		},
		{
			"id": "4d43cfb36ad257f3746df55c48001cbd",
			"key": [
				"4d43cfb36ad257f3746df55c48001cbd",
				0
			],
			"value": {
				"_id": "4d43cfb36ad257f3746df55c48001cbd",
				"_rev": "1-4d2650aed56e9f4eb1b64e141d31cd6c",
				"head": {
					"contentType": "personProfile"
				},
				"name": {
					"last": "Hilleke",
					"first": "Thomas"
				}
			}
		},
		{
			"id": "17d028b6aebef1b207d2266133001adf",
			"key": [
				"4d43cfb36ad257f3746df55c48001cbd",
				1,
				"thilleke"
			],
			"value": {
				"_id": "17d028b6aebef1b207d2266133001adf",
				"_rev": "15-2fd46c58f48790ddb2ae9800c9e76d24",
				"head": {
					"submissionTimestamp": [
						2011,
						6,
						18,
						"10:30:00.000Z"
					],
					"bcvRange": [
						"Jonah",
						1,
						1,
						"Jonah",
						4,
						11
					],
					"authorShortname": "thilleke",
					"author": {
						"guid": "4d43cfb36ad257f3746df55c48001cbd",
						"last": "Hilleke",
						"first": "Thomas"
					},
					"submittedBy": {
						"guid": "4d43cfb36ad257f3746df55c48002968",
						"first": "Eric",
						"last": "Pyle"
					},
					"source": {
						"guid": "s4",
						"name": "Biblical Horizons List"
					},
					"title": "Thomas Hilleke - The Names of God in Jonah",
					"contentType": "chiasm",
					"scripture-version": "",
					"ScriptureRange": "Jonah 1:1-4:11"
				},
				"body": {
					"concepts": [
						{
							"content": "1:1-4, Yahweh deals with Yonah"
						},
						{
							"content": "1:5-8, Elohim, God of water deals with the unconverted Gentiles"
						},
						{
							"content": "1:9, Yonah invokes the name Yahweh Elohim"
						},
						{
							"content": "1:10-17, Yahweh deals with the converted Gentiles and Yonah"
						},
						{
							"content": "2:1, Yonah invokes the name Yahweh Elohim"
						},
						{
							"content": "2:2-6, Yahweh deals with Yonah"
						},
						{
							"content": "2:6, Yonah invokes the name Yahweh Elohim"
						},
						{
							"content": "2:7-3:3, Yahweh deals with Yonah"
						},
						{
							"content": "3:3-4:1, Elohim deals with Gentiles before and after conversion. They do not offer sacrifice and take vows like the salty ones."
						},
						{
							"content": "4:2-5, Yahweh deals with Yonah (Yonah invokes the name El in 4:2 as part of his prayer to Yahweh)"
						},
						{
							"content": "4:6, Yahweh Elohim deals with Yonah"
						},
						{
							"content": "4:7-9, Elohim deals with Yonah"
						},
						{
							"content": "4:10-11, Yahweh deals with Yonah"
						}
					]
				}
			}
		},
		{
			"id": "4d43cfb36ad257f3746df55c48002968",
			"key": [
				"4d43cfb36ad257f3746df55c48002968",
				0
			],
			"value": {
				"_id": "4d43cfb36ad257f3746df55c48002968",
				"_rev": "1-556cb597e4d0c295b339b8aa12f4fc91",
				"head": {
					"contentType": "personProfile"
				},
				"name": {
					"first": "Eric",
					"last": "Pyle",
					"middle": "Daniel"
				},
				"organization": {
					"name": "Wycliffe Bible Translators",
					"website": "http://www.wycliffe.org"
				},
				"urls": [
					"http://www.facebook.com/eric.d.pyle"
				]
			}
		},
		{
			"id" : "774c87bd5ec2e4afb24a0ce0d1000c9f",
			"key": [
				"774c87bd5ec2e4afb24a0ce0d1000c9f", 2, "chiasm: unspecified author"],
			"value" :
			{
			   "_id": "774c87bd5ec2e4afb24a0ce0d1000c9f",
			   "_rev": "1-ca82b9dc8d4baef5b3ac381196e0b74d",
			   "head": {
			       "submissionTimestamp": [
			           2011,
			           12,
			           28,
			           "10:30:00.000Z"
			       ],
			       "bcvRange": [
			       ],
			       "title": "testing",
			       "ScriptureRange": "",
			       "contentType": "chiasm",
			       "scripture-version": ""
			   },
			   "body": {
			       "concepts": [
			           {
			               "content": "puppies"
			           },
			           {
			               "content": "piglets"
			           },
			           {
			               "content": "squeal"
			           },
			           {
			               "content": "wimper"
			           }
			       ]
			   }
			}
		}
	]
};


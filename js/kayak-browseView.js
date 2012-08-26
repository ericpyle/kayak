/*
 * @author Eric Pyle
 */

	function DisplayBooksAndChapters()
	{
		for(var property in BookStats) {
			if(typeof BookStats[property] == "string" || property.length == 3) {
				var bookNameLong = SILTitleAbbrToHeader_eng[property];
				var chapters = BookStats[property].chapters;
				var chapterHtml = "";
				for (var i=1; i <= chapters; i++) {
					
					/* chapterHtml += "<div style='margin:5px;display:run-in;float:left;'> " + i + " </div>" */
				  if (i < 10)
					 chapterHtml += "&nbsp;"
				  chapterHtml += i;
				  if (i < 8)
					 chapterHtml += "&nbsp; "
				  else
				  	chapterHtml += " ";
				};
				
				$("#BrowseByBook").append("<div><h3>" + bookNameLong + "</h3> <div style='width:250px;'>"+ chapterHtml +"</div></div>")
			}
		}
	}
	
	
	function DisplayBooksAndChapterFormat()
	{
		for(var property in BookStats) {
			if(typeof BookStats[property] == "string" || property.length == 3) {
				var bookNameLong = "";
				if (property.substr(0,1) == "1" || property.substr(0,1) == "2" || property.substr(0,1) == "3")
				{
					bookNameLong = property.substr(0,1) + " " + property.substr(1,1).toUpperCase() + property.substr(2,1).toLowerCase(); // SILTitleAbbrToHeader_eng[property];					
				}
				else
				 	bookNameLong = property.substr(0,1).toUpperCase() + property.substr(1,2).toLowerCase(); // SILTitleAbbrToHeader_eng[property];
				var chapterVerseHtml = "1:1";
				
				$("#BrowseByBook").append("<div>" + bookNameLong + " "+ chapterVerseHtml +"</div>")
			}
		}
	}
	
	/* 
	{"id":"974c87bd5ec2e4afb24a0ce0d1000c9f","key":[["GEN",1,1],"chiasm"],"value":{"_id":"974c87bd5ec2e4afb24a0ce0d1000c9f","head":{"ScriptureRange":"Genesis 1:1","contentType":"chiasm"}}},
	{"id":"A74c87bd5ec2e4afb24a0ce0d1000c9f","key":[["GEN",1,1,"GEN",1,2],"chiasm"],"value":{"_id":"A74c87bd5ec2e4afb24a0ce0d1000c9f","head":{"ScriptureRange":"Genesis 1:1-2","contentType":"chiasm"}}},
    */
	function filterOutlinesByBooks(outlinesKeyedByBCVRange, bookTargets)
	{
		var matchingOutlineRows = [];
		for (var i=0; i < outlinesKeyedByBCVRange.length; i++) {
		  var outlineRow = outlinesKeyedByBCVRange[i];
		  var bcvRange = outlineRow.key[0];
		  // filter 
		  // matchingOutlineRows
		}
		return matchingOutlineRows;
	}


	/*
	 *   var result = getChapterSlice(outlines, ["GEN",1]);
  		 var expected = {"outlines":["974c87bd5ec2e4afb24a0ce0d1000c9f","A74c87bd5ec2e4afb24a0ce0d1000c9f"]};
  		 ["GEN",1,1,"GEN",1,2]
  		 	0,  1,2  "3", 4,5
	 */
	function getChapterSlice(outlinesKeyedByBCVRange, targetBC)
	{
		var results = {};
		var matchingOutlines = [];
		for (var i=0; i < outlinesKeyedByBCVRange.length; i++) {
		  var outlineRow = outlinesKeyedByBCVRange[i];
		  var bcvRange = outlineRow.key[0];
		  // TODO: expand to include other books
		  if (targetBC[0] == bcvRange[0])
		  {
		  	if (bcvRange.length == 3 && targetBC[1] != bcvRange[1])
		  		continue;
		  	if (bcvRange.length == 6 && (targetBC[1] < bcvRange[1] || targetBC[1] > bcvRange[4]))
		  		continue;		  	
		  	 matchingOutlines.push(outlineRow.id);
		  }
		};		
		results["outlines"] = matchingOutlines;		
		return results;
	}
	
	function outlineInSet(outlineSet, idTarget)
	{
	  for (var j=0; j < outlineSet.length; j++) {
		 if (idTarget == outlineSet[j])
		 {
		 	return true;
		 } 
	  };
	  return false;
	}

	/*
	 * 
	 * var result = getVerseSlice(outlines, ["GEN",1,1]);
  	   var expected = {"outlines":["974c87bd5ec2e4afb24a0ce0d1000c9f","A74c87bd5ec2e4afb24a0ce0d1000c9f"]};
  	   		 ["GEN",1,1,"GEN",1,2]
  		 	    0,  1,2  "3", 4,5
	 */
	function getVerseSlice(outlinesKeyedByBCVRange, targetBCV)
	{
		var results = {"outlines":[]};
		var chapterSliceResult = getChapterSlice(outlinesKeyedByBCVRange, targetBCV);
		if (chapterSliceResult.outlines.length == 0)
			return results;
		
		var matchingOutlines = [];
		for (var i=0; i < outlinesKeyedByBCVRange.length; i++) {
		  var outlineRow = outlinesKeyedByBCVRange[i];
		  
		  // first only search in outlines who fit the right book and chapter range
		  if (!outlineInSet(chapterSliceResult.outlines, outlineRow.id))
		  	continue;
		  
		  var bcvRange = outlineRow.key[0];
		  // TODO: expand to include other chapters
		  if (targetBCV[1] >= bcvRange[1])
		  {
		  	if (bcvRange.length == 3 && targetBCV[2] != bcvRange[2])
		  		continue;
		  	if (bcvRange.length == 6 && targetBCV[1] > bcvRange[4])
		  		continue;
		  	if (bcvRange.length == 6 && targetBCV[1] == bcvRange[4] && (targetBCV[2] < bcvRange[2] || targetBCV[2] > bcvRange[5]))
		  		continue;
		  	 matchingOutlines.push(outlineRow.id);
		  }
		};		
		results["outlines"] = matchingOutlines;
		return results;	
	}
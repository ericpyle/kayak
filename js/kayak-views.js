/**
 * @author Pyle
 */


	var cAsciiA = 65; // 'A'

	function IndexToAsciiMarkerABC(index)
	{
		if (index > 25)
			index = index % 25;
	    asciiMarker = String.fromCharCode(cAsciiA + index);
		return asciiMarker;		
	}


function generatePanelIndent(outline)
{
	var panelOutput = {};
	if (outline.head.contentType != "panel" || outline.body.concepts.length == 0)
		return panelOutput;
	var contentParams = outline.head.contentParams;
	var concepts = outline.body.concepts;
	var repeated = 0;
	var indentStyles = [];
	var html = "";
	var indentSpacing = "";
	for (var i=0; i < concepts.length; i++) {
		var indentStyleNum = 1;		
		var indexForLabel = 1;
		indentStyleNum = contentParams.repeat != 0 ? ((i % contentParams.repeat) + 1) : i + 1;
		if (indentStyleNum > 1)
			indentSpacing += "&nbsp;&nbsp;&nbsp;&nbsp;";
		else if (indentStyleNum == 1)
			indentSpacing = "";
		if (!contentParams.header)
		{
			indexForLabel = indentStyleNum;
		}
		else
		{
			if (indentStyleNum == 1)
			{
				indexForLabel = IndexToAsciiMarkerABC((contentParams.repeat ? (i/contentParams.repeat) : 0)) // 1: 0(0) 1(1) 2(2), 2: 0(0) 1 2(1) 3, 3: 
			}
			else
			{
				indexForLabel = indentStyleNum - 1;	
			}
		}
		var classIndent = "panel-indent-level-" + indentStyleNum;
		// lookup to see if we've already added this
		// "." + classIndent
		if(!doTestAndDoSomething(indentStyles, function (item) { return item == ("." + classIndent); }))
		{
			indentStyles.push("." + classIndent);
		}		
		html += "<div class='"+ classIndent + (contentParams.header && indentStyleNum == 1 ? " panel-header" : "") + "'>" + 
			indentSpacing + "<span class='itemMarker'>"+ indexForLabel +"</span><span class='conceptContent'>"+ concepts[i].content +"</span></div>";
	};
	panelOutput["indentStyles"] = indentStyles;
	panelOutput["html"] = html;
	/*
	 *   
	 var expected = {
		  	"indentStyles": [".panel-indent-level-1"],
		  	"html" :   "<div class='panel-indent-level-1'><span class='itemMarker'>1</span><span class='conceptContent'>one line</span></div>"
		  };
	 */
	return panelOutput;
}


function arrayLookup()
{
	
}

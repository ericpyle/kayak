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


function setPanelHeadInterval(outline, iconcept)
{
	outline.head.contentParams["repeat"] = iconcept;
	return outline.head.contentParams.repeat;
}

function getIndentStyleNum(outline, iconcept)
{
	var contentParams = outline.head.contentParams;
	var indentStyleNum = contentParams.repeat != 0 ? ((iconcept % contentParams.repeat) + 1) : iconcept + 1;
	return indentStyleNum;
}

function getLabelForPanelIndex(outline, iconcept)
{
	var contentParams = outline.head.contentParams;
	var indexForLabel = 1;
	var indentStyleNum = getIndentStyleNum(outline, iconcept);
	if (!contentParams.header)
	{
		indexForLabel = indentStyleNum;
	}
	else
	{
		if (indentStyleNum == 1)
		{
			indexForLabel = IndexToAsciiMarkerABC((contentParams.repeat ? (iconcept/contentParams.repeat) : 0)) // 1: 0(0) 1(1) 2(2), 2: 0(0) 1 2(1) 3, 3: 
		}
		else
		{
			indexForLabel = indentStyleNum - 1;	
		}
	}
	return indexForLabel;
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
		var indentStyleNum = getIndentStyleNum(outline, i);
		if (indentStyleNum > 1)
			indentSpacing += "&nbsp;&nbsp;&nbsp;&nbsp;";
		else if (indentStyleNum == 1)
			indentSpacing = "";
		var indexForLabel = getLabelForPanelIndex(outline, i);
		var classIndent = "panel-indent-level-" + indentStyleNum;
		// lookup to see if we've already added this
		// "." + classIndent
		if(!doTestAndDoSomething(indentStyles, function (item) { return item == ("." + classIndent); }))
		{
			indentStyles.push("." + classIndent);
		}		
		html += "<div class='"+ classIndent + (contentParams.header && indentStyleNum == 1 ? " panel-header" : "") + "'>" + 
			indentSpacing + "<span class='itemMarker'>"+ indexForLabel +".</span><span class='conceptContent'>"+ concepts[i].content +"</span></div>";
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
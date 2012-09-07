/**
 * @author Pyle
 */

function CombineTitleAuthorAndSource(outline)
{
	var combinedSource = fetchSourceProfile(outline._id + "_source");
	var sourceDetails = formatCombinedSource(combinedSource, "");
	var author = fetchAuthorProfileByOutline(outline);
	var title = EmptyIfNull(outline.head.title);
	var titleCss = title.length > 0 ? '<div class="preview-outline-titleBlock-title">' + title + '</div>' : "";
	var authorName = formatName(author, "", (title.length > 0 || sourceDetails.length > 0));
	var authorNameCss = authorName.length > 0 ? '<div class="preview-outline-titleBlock-author">' + "by " + authorName + '</div>' : "";
	var combinedTitle1 = (title.length > 0 && authorName.length > 0) ? (titleCss + authorNameCss) : 
		((title.length > 0) ? titleCss : authorNameCss);
		

	return (combinedTitle1.length > 0 && sourceDetails.length > 0) ? (combinedTitle1 + "<div class='preview-outline-titleBlock-source'> &nbsp;(" + sourceDetails + ")</div>") :
		((combinedTitle1.length > 0) ? combinedTitle1 : sourceDetails);
}

function publishContentToSequentialPreviewTabs(concepts, iconcept, newContent)
{
	publishSequentialContentInPlace("#chiasm-indent", iconcept, newContent);
	publishSequentialContentInPlace("#chiasm-flat", iconcept, newContent);
	//publishContent("#tableViewAAB", iconcept, newContent);
}

function publishSequentialContentInPlace(containerSelector, iconcept, newContent)
{
	var viewConcept = $(containerSelector).find(".conceptContent").get(iconcept);
	$(viewConcept).first().html(newContent);
}

function publishContentToPanelTablePreviewTab(conceptsNotUsed, iconcept, newContent)
{
	publishContentToId(newContent, getPanelTableConceptId(iconcept));
}

function publishContentToChiasmTablePreviewTab(concepts, iconcept, newContent)
{
	publishContentToId(newContent, getViewConceptId("tableAAB", iconcept, concepts.length));
}

/*
 * NOTE: For Chiasm only. TODO: Rename.
 * preceded with "-level-A-[1/2]"
 */
function getBasicViewConceptId(indexABA, count)
{
	var conceptMarker = IndexToAsciiMarkerABA(indexABA, count);
	var halfway = Math.round(count/2);
	var basicViewConceptId = "-level-" + conceptMarker + "-" + (indexABA < halfway ? 1 : 2);
	return basicViewConceptId;
}

/*
 * NOTE: For Chiasm only. TODO: Rename.
 */
function getViewConceptId(view, indexABA, count)
{
	return view + getBasicViewConceptId(indexABA, count);
}

function publishContentToId(newContent, id)
{
	var viewConcept = $(jq(id)).find(".conceptContent").get(0);
	$(viewConcept).first().html(newContent);
}

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
	return generatePanelVertical(outline, "&nbsp;&nbsp;&nbsp;&nbsp;", "indent");
}

function generatePanelFlat(outline)
{
	return generatePanelVertical(outline, "", "flat");
}

function generatePanelVertical(outline, spacing, view)
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
			indentSpacing += spacing;
		else if (indentStyleNum == 1)
			indentSpacing = "";
		var indexForLabel = getLabelForPanelIndex(outline, i);
		var classIndent = view + "-panel-level-" + indentStyleNum;
		// lookup to see if we've already added this
		// "." + classIndent
		if(!doTestAndDoSomething(indentStyles, function (item) { return item == ("." + classIndent); }))
		{
			indentStyles.push("." + classIndent);
		}		
		var id = view + "-panel-concept-" + i;
		html += "<div id='"+ id +"' class='"+ classIndent + (contentParams.header && indentStyleNum == 1 ? " panel-header" : "") + "'>" + 
			indentSpacing + "<span class='itemMarker'>"+ indexForLabel +". </span><span class='conceptContent'>"+ concepts[i].content +"</span></div>";
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

function getPanelTableConceptId(iconcept)
{
	return "table-panel-concept-" + iconcept;	
}

// (if repeat == 2)
//  0   1   2
// [0] [2] [4] (+ row == 0)
//  3   4   5
// [1] [3] [5] (+ row == 1)

//i  0   1
//  [0] [4] [8]
//   2   3
//  [1] [5]
//   4   5
//  [2] [6]
//   6   7
//  [3] [7]

function generatePanelTable(outline)
{
	var panelOutput = {};
	if (outline.head.contentType != "panel" || outline.body.concepts.length == 0)
		return panelOutput;
	panelOutput["html"] = "";
	var contentParams = outline.head.contentParams;
	var concepts = outline.body.concepts;

	var cColumnsTotal = contentParams.repeat != 0 ? Math.max(Math.ceil(concepts.length / contentParams.repeat), 1) : 1;
	var cColumnsFull = contentParams.repeat != 0 ? Math.max(Math.floor(concepts.length / contentParams.repeat), 1) : 1;
	var cRows = Math.floor(concepts.length / cColumnsFull);
	var cCells = cColumnsTotal * cRows;
	var html = "";
	for (var i=0; i < cCells; i++) {
		var icolumn = i % cColumnsTotal;
		var irow =  Math.floor(i / cColumnsTotal);
		var icell = irow + icolumn * contentParams.repeat;
		if (icell >= concepts.length) 
			continue;
		
		// lookup to see if we've already added this
		// "." + classIndent
		if (icolumn == 0)
		{
			if (i == 0)
			{
				if (contentParams.header)
					html += "<thead>";
				else
					html += "<tbody>";
			}
			else
			{
				html += "</tr>";
				if (irow == 1 && icolumn == 0 && contentParams.header)
				{
					html += "</thead><tbody>";
				}
			}
				
			html += "<tr>";
		}
		var id = getPanelTableConceptId(icell); 
		html += "<td id='"+ id +"'><span class='conceptContent'>"+ concepts[icell].content +"</span></td>";
	
		/*
	 *   
	  	"html" :   "<thead><tr><td><span class='conceptContent'>header</span></td></tr></thead>" +
  				"<tbody><tr><td><span class='conceptContent'>first point</span></td></tr><tbody>"
		  };
	 */	
	};
	html += "</tr>";
	if (irow == 0 && contentParams.header)
		html += "</thead>";
	else
		html += "</tbody>";
	panelOutput["html"] = html;
	return panelOutput;
}


function generateHierarchicalFlat(outline)
{
	var response = {};
	if (outline.head.contentType != "outline" || outline.body.concepts.length == 0)
		return response;
	
	var html = "";
	var positionList = new Array();
	getConceptPositions(positionList, -1, null, outline.body.concepts);
	for (var i=0; i < positionList.length; i++) {
		var positionObj = positionList[i];
		var label = formatPositionIntoLabel_123(positionObj); //, ghostExists(positionList));
		
		html += "<div><span class='itemMarker'>"+ label +" </span><span class='conceptContent'>"+ positionObj.concept.content +"</span></div>";
	}
	response["html"] = html;
	return response;
}

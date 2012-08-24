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
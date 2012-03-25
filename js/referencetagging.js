/**
 * @author www.reftagger.com
 */
(function(h,e,g) {
	var b= {
		lbsBibleVersion:"ESV",
		lbsLibronixBibleVersion:"",
		lbsLogosBibleVersion:"",
		lbsAddLibronixDLSLink:!1,
		lbsAddLogosLink:!1,
		lbsAppendIconToLibLinks:!1,
		lbsAppendIconToLogosLinks:!1,
		lbsLibronixLinkIcon:null,
		lbsLogosLinkIcon:"dark",
		lbsUseTooltip:!0,
		lbsLinksOpenNewWindow:!1,
		lbsNoSearchTagNames:["h1","h2","h3"],
		lbsNoSearchClassNames:[],
		lbsRootNode:null,
		lbsCssOverride:!1,
		lbsCaseInsensitive:!1,
		lbsConvertHyperlinks:!1,
		lbsHyperlinkTestList:[],
		lbsMaxTreeDepth:200,
		lbsTargetSite:"biblia",
		insertRefNode: function(a,
		d,c,f) {
			var a=b.normalizeReference(a),c=c||b.lbsBibleVersion,m=b.addLinkAttributes(e.createElement("a"),a,c);
			m.innerHTML=d;
			f.parentNode.insertBefore(m,f);
			b.lbsAddLogosLink&&b.insertLibLink(f,a.replace(/(\d)\s*(?:[a-z]|ff)(\W|$)|/g,"$1$2").replace(/\s+/g,"").replace(/[\u2012\u2013\u2014\u2015]+/g,"-"),c);
			b.lbsRefCount++
		},
		normalizeReference: function(a) {
			a=a.replace(/(\s|\r?\n)+/g," ");
			return a=a.replace(/:/g,".")
		},
		addLinkAttributes: function(a,d,c) {
			var f=a.innerHTML;
			a.href=b.generateLink(d,c);
			a.innerHTML=
			f;
			a.lbsReference=d+"|"+c;
			a.className=a.className&&a.className.length>0?a.className+" lbsBibleRef":"lbsBibleRef";
			a.setAttribute("data-reference",d);
			a.setAttribute("data-version",c);
			if(b.lbsLinksOpenNewWindow)
				a.target="_blank";
			b.lbsUseTooltip&&(a.addEventListener?(a.addEventListener("mouseover",b.tooltipMouseOver,!1),a.addEventListener("mouseout",b.tooltipMouseOut,!1)):a.attachEvent&&(a.attachEvent("onmouseover",b.tooltipMouseOver),a.attachEvent("onmouseout",b.tooltipMouseOut)));
			return a
		},
		generateLink: function(a,
		d) {
			var c=[b.lbsTargetSite=="biblia"?"http://biblia.com/bible/":"http://bible.logos.com/passage/",b.getVersion(d),"/",a.replace(/:/g,".")];
			return encodeURI(c.join("").replace(/(\s|\r?\n)+/g," "))
		},
		insertLibLink: function(a,d) {
			var c=e.createElement("img"),f,m;
			c.src=(b.lbsLibronixLinkIcon||b.lbsLogosLinkIcon).toLowerCase()==="light"?e.location.protocol+"//www.logos.com/images/Corporate/LibronixLink_light.png":e.location.protocol+"//www.logos.com/images/Corporate/LibronixLink_dark.png";
			c.border=0;
			c.title=
			"Open in Logos Bible Software (if available)";
			c.style.marginLeft="4px";
			c.style.marginBottom="0px";
			c.style.marginRight="0px";
			c.style.border=0;
			c.style.padding=0;
			c.style["float"]="none";
			c.align="bottom";d?(f=e.createElement("a"),f.href=["libronixdls:keylink|ref=[en]bible:",d].join(""),m=b.lbsLogosBibleVersion||b.lbsLibronixBibleVersion,m.length&&m.toUpperCase()!=="DEFAULT"&&(f.href+="|res=LLS:"+m.toUpperCase()),f.className="lbsLibronix",f.appendChild(c),a.parentNode.insertBefore(f,a)):a.appendChild(c)
		},
		insertTextNode: function(a,b) {
			var c=e.createTextNode(a);
			b.parentNode.insertBefore(c,b)
		},
		refSearch: function(a,d,c,f,m,e) {
			var p=0,g=c,j=f,i,h,l,n,k=b.lbsBibleVersion,o=null,q=RegExp.rightContext;
			if(c&&(i=b.lbsBookContRegExp.exec(a)))q=RegExp.rightContext,l=[g," ",i[2]].join(""),j=i[3],n=i[1];
			if(f&&!i&&(i=b.lbsChapContRegExp.exec(a)))q=RegExp.rightContext,l=[g," ",j,":",i[2]].join(""),n=i[1];
			if(!i&&b.lbsRefQuickTest.test(a)&&(i=b.lbsRefRegExp.exec(a)))c=RegExp.leftContext,h=q=RegExp.rightContext,l=i[2],
				n=c+i[1],g=i[3],j=i[4],i[9]&&(o=i[9],k=o.replace(/\W/g,"")),i[8]&&(g=i[8],j=1);i?e?(a=b.normalizeReference(l),k=k||b.lbsBibleVersion,b.addLinkAttributes(e,a,k)):(h||(h=q),b.insertTextNode(n,d),b.insertRefNode(l,o===null?i[2]:i[2]+o,k,d),p=b.refSearch(h,d,g,j,k==b.lbsBibleVersion?null:k),p+=b.lbsAddLogosLink?3:2):a!==d.nodeValue&&(a&&m!=a&&b.insertTextNode(a,d),d.parentNode.removeChild(d));
			return p
		},
		traverseDom: function(a,d,c) {
			var c=c||0,f=0,e=!1,g=(a.tagName||"").toLowerCase(),h=a.className?a.className.split(" "):
			[],r=!1,j,i,s,l,n,k,o;
			if(c>b.lbsMaxTreeDepth)
				return 0;
			j=0;
			for(n=b.lbsNoSearchClassNames.length;j<n;j++) {
				k=0;
				for(o=h.length;k<o;k++)
					if(b.lbsNoSearchClassNames[j].toLowerCase()==h[k].toLowerCase()) {
						r=!0;
						break
					}
				if(r)
					break
			}
			if(a.nodeType===3)
				f=b.refSearch(a.nodeValue,a,null,null,null,d);
			else if(g.length>0&&(!b.lbsNoSearchTags[g]||g==="a")&&!r) {
				d=null;
				if(g==="a") {
					j=/^libronixdls:/i;
					if(j.test(a.href))
						(b.lbsAppendIconToLibLinks||b.lbsAppendIconToLogosLinks)&&(!a.lastChild||!(a.lastChild.tagName&&a.lastChild.tagName.toLowerCase()===
								"img"))&&b.insertLibLink(a,null);
					else if(/lbsBibleRef/i.test(a.className))l=a.getAttribute("data-reference"),j=a.getAttribute("data-version"),l&&b.addLinkAttributes(a,b.normalizeReference(l),j||b.lbsBibleVersion);
					else if(/bibleref/i.test(a.className))
						e=b.tagBibleref(a, function(a,d,c) {
							i=b.normalizeReference(d);
							s=c||b.lbsBibleVersion;
							b.addLinkAttributes(a,i,s)
						});
					else if(b.lbsConvertHyperlinks===!0&&a.childNodes.length===1&&a.firstChild.nodeType===3) {
						j=b.lbsHyperlinkTestList.length===0;
						for(l in b.lbsHyperlinkTestList)
							if(a.href.toLowerCase().indexOf(l.toLowerCase())>=
							0) {
								j=!0;
								break
							}
						j&&(d=a)
					}
					if(d===null)
						return f
				}
				g==="cite"&&/bibleref/.test(a.className.toLowerCase())&&(e=b.tagBibleref(a, function(a,d,c) {
						b.insertRefNode(d,a.innerHTML,c,a.firstChild);
						a.removeChild(a.lastChild)
					}));
				if(!e) {
					a=a.childNodes;
					for(j=0;j<a.length;)
						e=b.traverseDom(a[j],d,c+1),j+=e+1
				}
			}
			return f
		},
		tagBibleref: function(a,d) {
			var c=!1,f,e;
			b.MarkedBiblerefCount++;
			if(a.title&&a.childNodes.length<=1)c=/^([A-Z]{2,5})[\s:]/.exec(a.title),e=RegExp.rightContext,c?f=c[1]:e=a.title,d(a,e,f),c=!0;
			return c
		},
		getVersion: function(a) {
			a=
			a.toLowerCase();
			return(b.lbsTargetSite=="biblia"?b.lbsBibliaVersionAbbreviations[a]:b.lbsVersionAbbreviations[a])||a
		},
		tooltipMouseOver: function(a) {
			var d,c,f,a=a||h.event;
			for(d=a.target||a.srcElement;d.tagName.toLowerCase()!="a";)
				d=d.parentNode;
			b.lbsTooltipToHide&&(clearTimeout(b.lbsTmrHideTooltip),d!==b.lbsTooltipToHide&&b.hideTooltip(b.lbsTooltipToHide));
			c=e.getElementById(d.lbsReference);
			b.lbsTooltipToDisplay=d;c?(a=b.getWindowInfo(),f=b.getElementLocation(d),a=b.getTooltipLocation(c,a,f),c.style.left=
				a.x+"px",c.style.top=a.y+"px",b.lbsTmrShowTooltip=setTimeout( function() {
					b.showTooltip(c)
				},b.constShowTooltip)):b.lbsTmrShowTooltip=setTimeout( function() {
				var a=b.createTooltip(d);
				b.showTooltip(a)
			},b.constShowTooltip)
		},
		tooltipMouseOut: function(a) {
			a=a||h.event;
			for(a=a.target||a.srcElement;a.tagName.toLowerCase()!="a";)
				a=a.parentNode;
			clearTimeout(b.lbsTmrShowTooltip);
			if(a=e.getElementById(a.lbsReference))b.lbsTooltipToHide=a,b.lbsTmrHideTooltip=setTimeout( function() {
					b.hideTooltip(b.lbsTooltipToHide)
				},
				b.constHideTooltip)
		},
		createTooltip: function(a) {
			var d=b.getElementLocation(a),c=e.createElement("div"),f=b.getWindowInfo();
			c.style.position="absolute";
			c.style.width="350px";
			c.style.height="150px";
			c.style.zIndex="9999999";
			c.className="lbsTooltip";
			c.id=a.lbsReference;
			a=b.getTooltipLocation(c,f,d);
			c.style.top=a.y+"px";
			c.style.left=a.x+"px";
			c.onmouseover=b.mouseInTooltip;
			c.onmouseout=b.mouseLeavesTooltip;
			return c
		},
		getTooltipLocation: function(a,b,c) {
			var f=parseInt(a.style.width,10),a=parseInt(a.style.height,
			10),e=[];
			e.x=c.x+15;
			e.y=c.y-a;
			if(f>b.width||a>b.height)
				return e;
			e.x+=f;
			if(e.x>b.width+b.offX-10)
				e.x=b.width+b.offX-15-10;
			if(e.x<0)
				e.x=0;
			if(e.y<b.offY)
				e.y=c.y+a+25>b.height+b.offY?b.offY:c.y+25;
			e.x-=f+3;
			return e
		},
		getElementLocation: function(a) {
			var b= {
				x:0,
				y:0
			},c=a,f= {
				offX:0,
				offY:0
			};
			if(typeof a.offsetLeft==="number") {
				for(;a;)
					b.x+=a.offsetLeft,b.y+=a.offsetTop,a=a.offsetParent;
				for(;c&&c!==g&&c!==e.documentElement;)
					f.offY+=c.scrollTop||0,f.offX+=c.scrollLeft||0,c=c.parentNode;
				b.x-=f.offX;
				b.y-=f.offY
			} else if(a.x)b.x=
				a.x,b.y=a.y;
			return b
		},
		getWindowInfo: function() {
			var a= {},d;
			if(typeof h.innerHeight==="number")a.width=h.innerWidth,a.height=h.innerHeight;
			else if(e.documentElement&&(e.documentElement.clientHeight||e.documentElement.clientWidth))a.width=e.documentElement.clientWidth,a.height=e.documentElement.clientHeight;
			else if(g&&(g.clientWidth||g.clientHeight))a.width=g.clientWidth,a.height=g.clientHeight;
			if(d=b.getOffsets())a.offX=d.offX,a.offY=d.offY;
			return a
		},
		getOffsets: function(a) {
			var b=[];a?typeof a.scrollLeft===
			"number"&&(a.scrollLeft||a.scrollTop)?(b.offX=a.scrollLeft,b.offY=a.scrollTop):b=null:(b.offX=h.pageXOffset||g.scrollLeft||e.documentElement.scrollLeft,b.offY=h.pageYOffset||g.scrollTop||e.documentElement.scrollTop);
			return b
		},
		hideTooltip: function(a) {
			if(a&&a.style)
				a.style.visibility="hidden";
			b.lbsTooltipToHide=null
		},
		showTooltip: function(a) {e.getElementById(a.id)?a.style.visibility="visible":(g.appendChild?g.appendChild(a):g.innerHTML&&(g.innerHTML+=a.innerHTML),b.makeRequest(a))
		},
		mouseInTooltip: function() {
			clearTimeout(b.lbsTmrHideTooltip)
		},
		mouseLeavesTooltip: function() {
			b.lbsTmrHideTooltip=setTimeout( function() {
				b.hideTooltip(b.lbsTooltipToHide)
			},b.constHideTooltip)
		},
		dstRequests: {},
		requestTooltips: {},
		makeRequest: function(a) {
			var d=a.currentStyle?a.currentStyle.backgroundColor:"inherit",c=a.id.split("|"),c= function(c,d) {
				var f=[e.location.protocol],d=b.getVersion(d),c=encodeURIComponent(c);b.lbsTargetSite=="biblia"?f.push("//biblia.com/bible/"):f.push("//bible.logos.com/passage/");
				f.push(d,"/",c,"?target=reftagger&callback=Logos.ReferenceTagging.dstCallback&userData=",
				encodeURIComponent(a.id));
				return f.join("")
			}(c[0],c[1]||b.lbsBibleVersion),f=e.createElement("script");
			a.innerHTML=b.constructTooltipContent(d,"Loading...","","");
			f.setAttribute("type","text/javascript");
			f.setAttribute("charset","utf-8");
			f.setAttribute("src",c);
			b.dstRequests[a.id]=f;
			b.requestTooltips[a.id]=a;
			e.getElementsByTagName("head").item(0).appendChild(f);
			setTimeout( function() {
				if(b.requestTooltips[a.id]&&b.dstRequests[a.id])b.requestTooltips[a.id].innerHTML=b.constructTooltipContent(d,"Sorry",
					"<p>This reference could not be loaded at this time.</p>",""),b.dstRequests[a.id]=null,b.requestTooltips[a.id]=null
			},5E3)
		},
		dstCallback: function(a) {
			var d,c,f,g,h,p;b.lbsTargetSite=="biblia"?(d=a.userData,c=a.content,f=a.reference,g=a.version,h=a.resourceName):(d=a.UserData,c=a.Body,f=a.Header,h=g=a.Version);
			if(b.requestTooltips[d]&&b.dstRequests[d])a=b.requestTooltips[d],p=a.currentStyle?a.currentStyle.backgroundColor:"inherit",c=c.replace('<span class="verse-ref" />',""),f=b.constructTooltipContent(p,
				f+" ("+g+")",c,'<div style="float: left; margin-left: 8px;"><a href="'+b.generateLink(f,h)+'" target="_blank">More &raquo;</a></div>'),a.innerHTML=f.replace(/\<span\s*class="verse-ref"\s*\/>/gi,""),e.getElementsByTagName("head").item(0).removeChild(b.dstRequests[d]),b.dstRequests[d]=null,b.requestTooltips[d]=null
		},
		constructTooltipContent: function(a,b,c,f) {
			return'<div style="position: absolute; background: transparent url('+e.location.protocol+'//bible.logos.com/content/images/refTaggerDropShadow.png) no-repeat; width: 364px; height: 164px; left: -7px; top: -7px; z-index: -1"></div><div class="lbsContainer" style="height:150px; background-color:'+
			a+';"><div class="lbsTooltipHeader">'+b+'</div><div class="lbsTooltipBody" style="width:335px;">'+c+'</div><div class="lbsTooltipFooter" style="width:345px;">'+f+'<div><a href="http://www.logos.com/reftagger" target="_blank">Powered by RefTagger</a></div></div></div>'
		},
		appendCssRules: function() {
			if(!e.getElementById("lbsToolTipStyle")) {
				var a=e.createElement("link");
				a.type="text/css";
				a.rel="stylesheet";
				a.href=e.location.protocol+"css/ReferenceTagging.css";
				a.media="screen";
				a.id=
				"lbsToolTipStyle";
				e.getElementsByTagName("head")[0].insertBefore(a,e.getElementsByTagName("head")[0].firstChild)
			}
		},
		lbsSavePrefs: function() {
			var a=e.getElementById("lbsRefTaggerCP"),b=e.getElementById("lbsVersion").value,c=!!e.getElementById("lbsUseLibronixLinks").checked,f=new Date;
			if(a)f.setFullYear(f.getFullYear()+10),e.cookie="lbsRefTaggerPrefs="+b+"."+c+";expires="+f.toGMTString()+";path=/",h.location.reload()
		},
		loadPrefs: function() {
			var a=/lbsRefTaggerPrefs=(?:((?:\w|\d){2,5})\.(true|false))/.exec(e.cookie),
			d=e.getElementById("lbsRefTaggerCP"),c;
			if(a)b.lbsBibleVersion=a[1],b.lbsAddLogosLink=a[2]=="true";
			if(d!==null) {
				a=e.getElementById("lbsVersion");
				d=0;
				for(c=a.length;d<c;d++)
					if(a.options[d].outerText==b.lbsBibleVersion.toUpperCase()) {
						a.selectedIndex=d;
						break
					}
				if(b.lbsAddLogosLink)
					e.getElementById("lbsUseLibronixLinks").checked="true"
			}
		},
		log: function(a) {
			//(new Image).src=[e.location.protocol,"//bible.logos.com/util/ReferenceData.aspx?location=",encodeURIComponent(e.location),"&refCount=",Number(b.lbsRefCount),
			//"&microrefCount=",Number(b.MarkedBiblerefCount),"&bibleVersion=",encodeURIComponent(b.lbsBibleVersion),"&libronix=",!!b.lbsAddLogosLink,"&tooltip=",!!b.lbsUseTooltip,"&source=",encodeURIComponent(a||""),"&rand=",Math.random().toString().substring(10)].join("")
		},
		Init: function() {
			if(!b.Initialized) {
				var a,d;
				b.lbsCssOverride||b.appendCssRules();
				b.loadPrefs();
				b.lbsNoSearchTags= {
					applet:!0,
					hr:!0,
					head:!0,
					img:!0,
					input:!0,
					meta:!0,
					script:!0,
					select:!0,
					textarea:!0
				};
				for(d in b.lbsNoSearchTagNames)
					a=b.lbsNoSearchTagNames[d],
					b.lbsNoSearchTags[a]=!0;
				b.lbsNoSearchClasses= {};
				for(d in b.lbsNoSearchClassNames)
					b.lbsNoSearchClasses[b.lbsNoSearchClassNames[d]]=!0;
				b.lbsVersionAbbreviations= {
					dar:"darby"
				};
				b.lbsBibliaVersionAbbreviations= {
					dar:"darby",
					nasb:"nasb95",
					gw:"godsword",
					kjv21:"kjv1900",
					nivuk:"niv",
					kar:"hu-bible",
					byz:"byzprsd",
					kjv:"kjv1900",
					net:"gs-netbible"
				};
				b.lbsRefCount=0;
				b.MarkedBiblerefCount=0;
				b.constShowTooltip=300;
				b.constHideTooltip=400;
				a=["AB","ASV","CEV","DARBY","DAR","ESV","GW","HCSB","KJ21","KJV","NASB","NCV","NET",
				"NIRV","NIV","NIVUK","NKJV","NLT","NLV","MESSAGE","TNIV","WE","WNT","YLT","TNIV","NIRV","TNIV","NASB","WESTCOTT","CHASAOT","STEPHENS","AV 1873","KJV APOC","ELZEVIR","IT-DIODATI1649","TISCH","TISCHENDORF","CS-KR1579","TR1881","TR1894MR","TR1550MR","KAR","BYZ","LEB"];
				b.lbsRefQuickTest=RegExp("((\\d{1,3})(?:\\s?\\:\\s?|\\.)(\\d{1,3}(?:(?:\\s?(?:[a-z]|ff))(?=\\W|$))?))|(Ob(?:ad(?:iah)?)?|Ph(?:ilem(?:on)?|m)|(?:(?:2(?:nd\\s)?|[Ss]econd\\s|II\\s)|(?:3(?:rd\\s)?|[Tt]hird\\s|III\\s))\\s*J(?:o(?:hn?)?|h?n)|Jude?)",
				"i");
				b.lbsRefRegExp=RegExp("(\\W|^)((Z(?:e(?:p(?:h(?:aniah)?)?|c(?:h(?:ariah)?)?)|[pc])|W(?:is(?:d(?:om(?:\\s+of\\s+(?:Ben\\s+Sirah?|Solomon))?|.?\\s+of\\s+Sol))?|s)|T(?:ob(?:it)?|it(?:us)?|he(?:\\s+(?:Song\\s+of\\s+(?:Three\\s+(?:Youth|Jew)s|the\\s+Three\\s+Holy\\s+Children)|Re(?:velation|st\\s+of\\s+Esther))|ssalonians)|b)|S(?:us(?:anna)?|o(?:ng(?:\\s+(?:of\\s+(?:Thr(?:ee(?:\\s+(?:(?:Youth|Jew)s|Children))?)?|So(?:l(?:omon)?|ngs)|the\\s+Three\\s+Holy\\s+Children)|Thr))?)?|ir(?:a(?:c?h)?)?|OS)|R(?:u(?:th)?|o(?:m(?:ans)?)?|e(?:v(?:elation)?|st\\s+of\\s+Esther)?|[vm]|th)|Qoh(?:eleth)?|P(?:s(?:\\s+Sol(?:omon)?|a(?:lm(?:s(?:\\s+(?:of\\s+)?Solomon)?)?)?|Sol|s|l?m)?|r(?:ov(?:erbs)?|\\s+(?:(?:of\\s+)?Man|Az)|ayer\\s+of\\s+(?:Manasse[sh]|Azariah)|v)?|h(?:il(?:em(?:on)?|ippians)?|[pm])|Ma)|O(?:b(?:ad(?:iah)?)?|des)|N(?:u(?:m(?:bers)?)?|e(?:h(?:emiah)?)?|a(?:h(?:um)?)?|[mb])|M(?:rk?|ic(?:ah)?|a(?:t(?:t(?:hew)?)?|l(?:achi)?|r(?:k))|[tlk])|L(?:uke?|e(?:v(?:iticus)?|t(?:ter\\s+of\\s+Jeremiah|\\s+Jer))?|a(?:od(?:iceans)?|m(?:entations)?)?|[vk]|tr\\s+Jer|Je)|J(?:ud(?:g(?:es)?|ith|e)?|o(?:s(?:h(?:ua)?)?|n(?:ah)?|el?|hn|b)|nh?|e(?:r(?:emiah)?)?|d(?:th?|gs?)|a(?:me)?s|[ts]h|[rmlgb]|hn)|Is(?:a(?:iah)?)?|H(?:o(?:s(?:ea)?)?|e(?:b(?:rews)?)?|a(?:g(?:gai)?|b(?:akkuk)?)|g)|G(?:e(?:n(?:esis)?)?|a(?:l(?:atians)?)?|n)|E(?:z(?:ra?|e(?:k(?:iel)?)?|k)|x(?:o(?:d(?:us)?)?)?|s(?:th(?:er)?)?|p(?:ist(?:le\\s+(?:to\\s+(?:the\\s+)?Laodiceans|Laodiceans)|\\s+Laodiceans)|h(?:es(?:ians)?)?|\\s+Laod)?|c(?:cl(?:es(?:iast(?:icu|e)s)?|us)?)?|noch)|D(?:eut(?:eronomy)?|a(?:n(?:iel)?)?|[tn])|C(?:ol(?:ossians)?|anticle(?:\\s+of\\s+Canticle)?s)|B(?:el(?:\\s+and\\s+the\\s+Dragon)?|ar(?:uch)?)|A(?:m(?:os)?|dd(?:\\s+(?:Ps(?:alm)?|Es(?:th)?)|ition(?:s\\s+to\\s+Esther|al\\s+Psalm)|Esth)|c(?:(?:t)s)?|zariah|Es)|\u03c8|(?:4(?:th\\s)?|[Ff]ourth\\s|(?:IIII|IV)\\s)\\s*(?:Ma(?:c(?:c(?:abees)?)?)?)|(?:3(?:rd\\s)?|[Tt]hird\\s|III\\s)\\s*(?:Ma(?:c(?:c(?:abees)?)?)?|Jo(?:h(?:n)?)?|Jn\\.?|Jhn)|(?:(?:2(?:nd\\s)?|[Ss]econd\\s|II\\s)|(?:1(?:st\\s)?|[Ff]irst\\s|I\\s))\\s*(?:T(?:i(?:m(?:othy)?)?|h(?:es(?:s(?:alonians)?)?)?)|S(?:a(?:m(?:uel)?)?|m)?|P(?:e(?:t(?:er)?)?|t)|Ma(?:c(?:c(?:abees)?)?)?|K(?:i(?:n(?:gs)?)?|gs)|J(?:o(?:hn?)?|h?n)|Es(?:d(?:r(?:as)?)?)?|C(?:o(?:r(?:inthians)?)?|h(?:r(?:on(?:icles)?)?)?)))(?:\\.?\\s*(\\d{1,3})(?:\\s?\\:\\s?|\\.)(\\d{1,3}(?:(?:\\s?(?:[a-z]|ff))(?=\\W|$))?)(\\s?(?:-|--|\\u2013|\\u2014)\\s?\\d{1,3}(?:(?:\\s?(?:[a-z]|ff))(?=\\W|$))?((?:\\s?\\:\\s?|\\.)\\d{1,3}(?:(?:\\s?(?:[a-z]|ff))(?=\\W|$))?)?(?!\\s*(?:T(?:i(?:m(?:othy)?)?|h(?:es(?:s(?:alonians)?)?)?)|S(?:a(?:m(?:uel)?)?|m)?|P(?:e(?:t(?:er)?)?|t)|Ma(?:c(?:c(?:abees)?)?)?|K(?:i(?:n(?:gs)?)?|gs)|J(?:o(?:hn?)?|h?n)|Es(?:d(?:r(?:as)?)?)?|C(?:o(?:r(?:inthians)?)?|h(?:r(?:on(?:icles)?)?)?))(?:\\W)))?)|(Ob(?:ad(?:iah)?)?|Ph(?:ilem(?:on)?|m)|(?:(?:2(?:nd\\s)?|[Ss]econd\\s|II\\s)|(?:3(?:rd\\s)?|[Tt]hird\\s|III\\s))\\s*J(?:o(?:hn?)?|h?n)|Jude?)\\s*\\d{1,3}(?:(?:\\s?(?:[a-z]|ff))(?=\\W|$))?(?:\\s?(?:-|--|\\u2013|\\u2014)\\s?\\d{1,3}(?:(?:\\s?(?:[a-z]|ff))(?=\\W|$))?)?)([,]?\\s?(?:"+
				a.join("|")+")|[,]?\\s?[(](?:"+a.join("|")+")[)])?",b.lbsCaseInsensitive?"i":"");
				b.lbsBookContRegExp=RegExp("^((?:(?:[,;\\.]+)?\\s?(?:and|or|&|&amp;)?)\\s*(?:(?:(?:cf|Cf|CF)[.,]?\\s?(?:v(?:v|ss?)?[.]?)?)[.,]?\\s*)?)((\\d{1,3})(?:\\s?\\:\\s?|\\.)\\d{1,3}(?:(?:\\s?(?:[a-z]|ff))(?=\\W|$))?(?:\\s?(?:-|--|\\u2013|\\u2014)\\s?\\d{1,3}(?:(?:\\s?\\:\\s?|\\.)\\d{1,3}(?:(?:\\s?(?:[a-z]|ff))(?=\\W|$))?)?)?)");
				b.lbsChapContRegExp=RegExp("^((?:(?:[,;\\.]+)?\\s?(?:and|or|&|&amp;)?)\\s*(?:(?:(?:cf|Cf|CF)[.,]?\\s?(?:v(?:v|ss?)?[.]?)?)[.,]?\\s*)?)(\\d{1,3}(?:(?:\\s?(?:[a-z]|ff))(?=\\W|$))?(?:\\s?(?:-|--|\\u2013|\\u2014)\\s?\\d{1,3}(?:(?:\\s?(?:[a-z]|ff))(?=\\W|$))?)?)(?!\\s*(?:st|nd|rd|th|T(?:i(?:m(?:othy)?)?|h(?:es(?:s(?:alonians)?)?)?)|S(?:a(?:m(?:uel)?)?|m)?|P(?:e(?:t(?:er)?)?|t)|Ma(?:c(?:c(?:abees)?)?)?|K(?:i(?:n(?:gs)?)?|gs)|J(?:o(?:hn?)?|h?n)|Es(?:d(?:r(?:as)?)?)?|C(?:o(?:r(?:inthians)?)?|h(?:r(?:on(?:icles)?)?)?)))",
				b.lbsCaseInsensitive?"i":"");
				b.Initialized=!0
			}
		},
		tag: function(a,d) {
			b.lbsAddLogosLink=b.lbsAddLogosLink||b.lbsAddLibronixDLSLink;
			"ab".match(/b/);
			e.getElementById&&e.childNodes&&e.createElement&&RegExp.leftContext&&(b.Initialized||b.Init(),b.traverseDom(a||b.lbsRootNode||g),setTimeout( function() {
					b.log(d)
				},0))
		}
	};
	h.Logos=h.Logos|| {};
	h.Logos.ReferenceTagging=h.Logos.ReferenceTagging||b
})(window,document,document.body);
Sunburst viz for the audit of Confiscati Bene EU, v0.3.0

Live versione: http://ondata.github.io/cb-eu-audit-sunburst/.

The viz can be customize via GET parameters passed in URL. Here are the managed parameters:

* country=[ISO3166-1 alpha3 code]
* lang=[ISO3166-1 alpha3 code of the country or 'default']
* ncolors=[three css color names separated by commas (,)]
* hcolors=[three hex color codes separated by commas (,) without hash (#)]

If not specified, *lang* parameter is internally set equal to *country* one by default.

Colors are mapped to answers Y, N.A., N, respectively.
Note that *h*color has priority to *n*color, if both defined.

Examples:

* http://ondata.github.io/cb-eu-audit-sunburst/?country=ita&lang=gbr&ncolors=green,grey,red
* http://ondata.github.io/cb-eu-audit-sunburst/?country=ita&ncolors=green,grey,red
* http://ondata.github.io/cb-eu-audit-sunburst/?country=ita&hcolors=aaa,ccc,eee

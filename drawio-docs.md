Generate and validate draw.io diagrams with AI
draw.io diagram files (.drawio) use a well-defined XML format that AI systems can generate and validate programmatically. Two reference documents are provided to help AI models produce correct .drawio diagram files.

Reference documents
draw.io Style Reference — A comprehensive guide covering the complete .drawio file structure, all style properties, shape types, edge routing, color palettes, HTML labels, layers, groups, and complete examples. This is the primary document an AI system needs to generate valid draw.io files.

mxfile.xsd — An XML Schema Definition (XSD) for validating the structure of .drawio files. Use this to validate AI-generated output before saving or delivering it to users.

draw.io MCP server
The draw.io MCP server provides four ways to integrate AI-generated diagrams with draw.io:

Approach	What it does	Production endpoint
MCP App Server	Renders diagrams inline in AI chat as an interactive viewer, with download as .drawio, PNG or SVG and copy as XML or PNG where the host allows it (see below)	mcp.draw.io/mcp — add as a remote MCP server
MCP Tool Server	Opens diagrams in the draw.io editor in your browser (supports XML, CSV, and Mermaid)	@drawio/mcp on npm — run with npx @drawio/mcp
Assistant Plugins	Generates native .drawio files with optional PNG/SVG/PDF export via the draw.io Desktop CLI, or a browser URL	Plugins for Claude Code, Codex CLI and GitHub Copilot CLI — install from the jgraph/drawio-mcp marketplace
Project Instructions	Claude generates draw.io URLs via Python — no installation required	Paste instructions into a Claude Project
All four approaches share a single source of truth for XML generation rules (edge routing, containers, layers, tags, metadata, dark mode, style properties):

shared/xml-reference.md — The canonical XML generation reference used by all prompts
The MCP servers read this file at startup and return it from their get_drawio_reference tool, which the AI model calls before its first diagram, so that their tool descriptions stay short. The assistant plugins and project instructions reference it via URL.

Download and copy in the MCP App Server viewer
Download and Copy in the viewer toolbar are split buttons: the button runs the default action, the arrow next to it opens a menu of image formats. The viewer decides from the capabilities the host declares at runtime and from what the browser supports, never from the host's name. Entries it can't offer are hidden, not disabled, and an arrow without entries is hidden.

Entry	Output	Requires
Download	diagram.drawio (application/vnd.jgraph.mxfile)	hostCapabilities.downloadFile; the file is saved through ui/download-file
Download PNG	diagram.png at scale 2, with the .drawio file in a tEXt chunk (embedded XML)	downloadFile, and a browser that can draw the diagram to an untainted canvas
Download SVG	diagram.svg at scale 1, with the .drawio file in the content attribute	downloadFile
Copy	The draw.io XML as text	None
Copy as PNG	An image/png clipboard item at scale 2, without the .drawio file	hostCapabilities.sandbox.permissions.clipboardWrite, which the resource requests in _meta.ui.permissions; ClipboardItem and the clipboard-write permissions policy in the browser; the canvas as for PNG
Images are drawn by draw.io's own export code in the viewer bundle, with a 10 px border. They take the page colour (background), shadow and adaptiveColors from the diagram's mxGraphModel.
The PNG uses the viewer's colour scheme (prefers-color-scheme). The SVG follows the light or dark mode of wherever it is displayed.
With adaptiveColors="none", both images use the light colours, and an SVG without a background gets a white page.
Images in the diagram are embedded. In the SVG, icons from the draw.io shape libraries are embedded as PNG.
File format overview
A full .drawio file is XML with this structure:

<mxfile>
  <diagram id="page-1" name="Page-1">
    <mxGraphModel dx="0" dy="0" grid="1" gridSize="10" guides="1"
                  tooltips="1" connect="1" arrows="1" fold="1"
                  page="1" pageScale="1" pageWidth="850" pageHeight="1100"
                  math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <!-- Diagram elements go here with parent="1" -->
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>

Each diagram element is an mxCell with either vertex="1" (shapes) or edge="1" (connectors). Visual appearance is controlled via a style attribute containing semicolon-separated key=value pairs.

Simplified format: mxGraphModel only
AI systems can also generate just the <mxGraphModel> element without the <mxfile> and <diagram> wrappers. This is a valid draw.io XML fragment and is easier for AI to generate since there are fewer nesting levels and no need for diagram/page metadata:

<mxGraphModel adaptiveColors="auto">
  <root>
    <mxCell id="0" />
    <mxCell id="1" parent="0" />
    <mxCell id="2" value="Hello" style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1">
      <mxGeometry x="100" y="100" width="120" height="60" as="geometry" />
    </mxCell>
  </root>
</mxGraphModel>


draw.io accepts both formats. When a bare <mxGraphModel> is opened, draw.io wraps it in the <mxfile> and <diagram> elements automatically. The simplified format is recommended for AI generation when multi-page support is not needed.

File-level variables
The <mxfile> element supports a vars attribute containing a JSON object of key-value pairs. These are global variables that can be referenced in labels and tooltips using %variableName% placeholder syntax. Users can edit them via File > Properties > Edit Data in the draw.io editor.

To enable placeholder substitution on a cell, you must set the placeholders="1" attribute on its UserObject (or object) wrapper. A style key does not work: placeholders=1 in the style string is ignored, so a plain mxCell has to be wrapped in a UserObject to use placeholders. Without this attribute, %name% tokens are rendered as literal text.

<mxfile vars='{"project":"Atlas","version":"2.1","author":"Jane Doe"}'>
  <diagram id="page-1" name="Page-1">
    <mxGraphModel>
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <UserObject id="2" label="Project: %project% v%version%" placeholders="1">
          <mxCell style="text;html=1;align=center;" vertex="1" parent="1">
            <mxGeometry x="100" y="100" width="200" height="40" as="geometry" />
          </mxCell>
        </UserObject>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>

When the diagram is rendered, %project% is replaced with Atlas and %version% with 2.1. File-level variables are only available when using the full <mxfile> format (not the simplified <mxGraphModel>-only format).

Compressed format
The .drawio file format also supports a compressed representation where the diagram content inside the <diagram> element is deflate-compressed and Base64-encoded instead of containing an <mxGraphModel> child element directly. While draw.io uses this compressed format by default when saving files, AI systems should not generate compressed content. Compressed XML uses more tokens (the Base64 encoding is larger than the raw XML), is not human-readable, and cannot be validated or debugged without decompression.

If you need to create compressed content anyway (e.g. for passing diagram data via URLs), the process is:

Take the XML string (either the full <mxfile> or just the <mxGraphModel>)
URL-encode it with encodeURIComponent()
Compress with raw DEFLATE (not zlib — no headers)
Base64-encode the compressed bytes
In JavaScript with the pako library:

function compressDrawioXml(xml) {
  var encoded = encodeURIComponent(xml);
  var compressed = pako.deflateRaw(encoded);
  return btoa(Array.from(compressed, function(b) {
    return String.fromCharCode(b);
  }).join(""));
}

Key rules for AI generation
Always include the two structural cells — <mxCell id="0"/> (root container) and <mxCell id="1" parent="0"/> (default layer) are mandatory.
Use uncompressed XML — AI should generate plain XML, not compressed/Base64-encoded content.
Never include XML comments — <!-- --> comments are strictly forbidden. They waste tokens, can cause parse errors, and serve no purpose in diagram XML.
All IDs must be unique within a diagram.
Vertices need vertex="1", edges need edge="1"** — these are mutually exclusive.
Style strings use key=value; format — e.g. "rounded=1;whiteSpace=wrap;html=1;fillColor=#DAE8FC;".
Match perimeters to shapes — non-rectangular shapes need a matching perimeter= value (e.g. ellipse needs perimeter=ellipsePerimeter).
Coordinates: (0,0) is top-left — x increases rightward, y increases downward.
HTML in value must be XML-escaped — use &lt;, &gt;, &amp;, &quot;.
Children of groups use relative coordinates — positions are relative to the parent container, not the canvas.
Edge routing, containers, metadata, and layers
For detailed guidance on edge routing (waypoints, arrowhead clearance, connection points), containers and groups, custom metadata with object/UserObject, placeholder scoping, layers, and tags, see the shared XML generation reference:

shared/xml-reference.md

This is the single source of truth used by all draw.io MCP server prompts.

Opening AI-generated diagrams in draw.io
Opening in the editor with the #create URL
To open an AI-generated diagram directly in the draw.io editor, compress the XML and pass it via the URL hash using the #create parameter:

https://app.diagrams.net/?grid=0&pv=0#create=ENCODED_JSON

The #create value is a URL-encoded JSON object:

{
  "type": "xml",
  "compressed": true,
  "data": "BASE64_DEFLATED_XML"
}

The type field can be "xml", "csv", or "mermaid". The data field contains the diagram content compressed as described in the compressed format section above.

When type is "mermaid", the diagram is inserted as editable draw.io shapes by default. Add "image": true to the JSON object to insert it as a single static SVG image instead (the Mermaid source is kept on the image so it can be re-edited):

{
  "type": "mermaid",
  "image": true,
  "data": "graph TD;\n  A-->B;\n  A-->C;"
}

Running a layout on the created diagram
Add an optional layout field to the #create JSON object to run a layout on the diagram after it is created. This works for every type (xml, csv, mermaid, generate) and is useful when the supplied diagram has no meaningful coordinates and you want draw.io to position the shapes.

The layout value uses the same format as the desktop CLI --layout flag and the embed protocol's layout action. It is either a preset name or a custom-layout JSON array:

{
  "type": "xml",
  "data": "<mxGraphModel>...</mxGraphModel>",
  "layout": "verticalFlow"
}

{
  "type": "xml",
  "data": "<mxGraphModel>...</mxGraphModel>",
  "layout": [
    { "layout": "elkLayered", "config": { "elk.direction": "RIGHT" } }
  ]
}

The preset names are the same as the Arrange > Layout menu: verticalFlow, horizontalFlow, verticalTree, horizontalTree, radialTree, and organic. The array form is the full JSON layout specification, which supports layout sequences and per-layout options. The array can also be passed as a JSON string (starting with [).

After the layout runs, the editor updates the #create hash to the laid-out XML and removes the layout field, so reloading the page reproduces the result without running the layout again.

Applying the layouts defined in the diagram
A diagram can also carry its layouts in the shape styles: a cell whose style defines a childLayout (for example childLayout=flowLayout;flowOrientation=west;) lays out its children automatically. These layouts run in response to changes while the diagram is edited, but not when it is opened — so a generated diagram that relies on them is displayed at its stored coordinates (typically all (0,0)) until the first edit.

Add "applyLayouts": true to run them once, right after the diagram is created:

{
  "type": "xml",
  "data": "<mxGraphModel>...</mxGraphModel>",
  "applyLayouts": true
}

Nested containers are laid out from the inside out, so an outer container sees the final size of the containers it contains. This is useful when generating a diagram that defines its own layout containers and leaves the positioning to draw.io.

applyLayouts and layout are independent and can be combined: applyLayouts runs the layouts defined in the diagram, layout runs one layout on the whole page. When both are given, applyLayouts runs first, so the page layout sees the containers at their final size. Like layout, the field is removed from the rewritten #create hash, which then carries the laid-out XML.

Complete JavaScript example for generating an editor URL from XML:

function generateDrawioEditUrl(xml) {
  var encoded = encodeURIComponent(xml);
  var compressed = pako.deflateRaw(encoded);
  var base64 = btoa(Array.from(compressed, function(b) {
    return String.fromCharCode(b);
  }).join(""));
  var createObj = { type: "xml", compressed: true, data: base64, effect: "pop" };

  return "https://app.diagrams.net/?pv=0&grid=0#create="
    + encodeURIComponent(JSON.stringify(createObj));
}

Optional query parameters:

lightbox=1 — open in read-only lightbox view
edit=_blank — add an edit button that opens the editor in a new tab
dark=1 — enable dark mode
grid=0 — hide the grid
pv=0 — hide the page view selector
border=10 — set the border size in pixels
Embedding with the viewer
To display a diagram inline in a web page without the full editor, use the draw.io viewer library. Load viewer-static.min.js from the CDN, then create a <div> with the diagram configuration in a data-mxgraph attribute:

<script src="https://viewer.diagrams.net/js/viewer-static.min.js" async></script>

<div class="mxgraph" data-mxgraph='{"highlight":"#0000ff","nav":true,"resize":true,"toolbar":"zoom layers tags","xml":"DIAGRAM_XML_HERE"}'></div>


The viewer automatically processes all elements with class="mxgraph" when the library loads. The xml property in the JSON configuration contains the raw (uncompressed) diagram XML. The container element must have a non-zero width for the viewer to render correctly.

Configuration options for the data-mxgraph JSON:

xml — the diagram XML (uncompressed)
highlight — highlight color for hover effects
nav — enable navigation controls
resize — allow the viewer to resize
toolbar — space-separated list of toolbar buttons (e.g. "zoom layers tags")
dark-mode — set to "auto" to follow the page's color scheme
After the viewer has loaded, call GraphViewer.processElements() to render any dynamically added diagram elements.

Validation
Use the mxfile.xsd schema to validate the XML structure of generated files. The schema covers the element hierarchy and attribute types. For style string validation (which properties and values are valid), refer to the Style Reference.

The style reference also includes a validation checklist covering the most common issues in AI-generated diagrams.
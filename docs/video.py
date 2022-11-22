import os
from docutils import nodes
from docutils.parsers.rst import directives, Directive

def get_option(options, key, default):
    if key not in options.keys():
        return default

    if type(default) == type(True):
        return True
    else:   
        return options[key]

class video(nodes.General, nodes.Element): pass

class Video(Directive):
    has_content = True
    required_arguments = 1
    optional_arguments = 5
    final_argument_whitespace = False
    option_spec = {
        "alt": directives.unchanged,
        "width": directives.unchanged,
        "height": directives.unchanged,
        "autoplay": directives.flag,
        "nocontrols": directives.flag,
        "loop": directives.flag,
    }

    def run(self):
        alt = get_option(self.options, "alt", "Video")
        width = get_option(self.options, "width", "")
        height = get_option(self.options, "height", "")
        autoplay = get_option(self.options, "autoplay", False)
        nocontrols = get_option(self.options, "nocontrols", False)
        loop = get_option(self.options, "loop", False)

        video_node = video(
            path=self.arguments[0],
            alt=alt, 
            width=width,
            height=height, 
            autoplay=autoplay, 
            nocontrols=nocontrols,
            loop=loop
        )

        if self.content:
            node = nodes.Element()

            self.state.nested_parse(self.content, self.content_offset, node)
            first_node = node[0]
            figure_node = nodes.figure('', video_node)
            if isinstance(first_node, nodes.paragraph):
                caption = nodes.caption(first_node.rawsource, '',
                                        *first_node.children)
                caption.source = first_node.source
                caption.line = first_node.line
                figure_node += caption
            elif not (isinstance(first_node, nodes.comment)
                      and len(first_node) == 0):
                error = self.state_machine.reporter.error(
                      'Figure caption must be a paragraph or empty comment.',
                      nodes.literal_block(self.block_text, self.block_text),
                      line=self.lineno)
                return [figure_node, error]
            if len(node) > 1:
                figure_node += nodes.legend('', *node[1:])

            return [figure_node]
        
        return [video_node]

def visit_video_node(self, node):
    extension = os.path.splitext(node["path"])[1][1:]

    html_block = '''
        <video {width} {height} {nocontrols} {autoplay} {loop}>
            <source src="{path}" type="video/{filetype}">
            {alt}
        </video>
    '''.format(
        width="width=\"" + node["width"] + "\"" if node["width"] else "", 
        height="height=\"" + node["height"] + "\"" if node["height"] else "",
        path=node["path"], 
        filetype=extension,
        alt=node["alt"],
        autoplay="autoplay" if node["autoplay"] else "",
        nocontrols="" if node["nocontrols"] else "controls",
        loop="loop" if node["loop"] else ""
        )

    self.body.append(html_block)

def depart_video_node(self, node):
    pass

def setup(app):
    app.add_node(video, html=(visit_video_node, depart_video_node))
    app.add_directive("video", Video)

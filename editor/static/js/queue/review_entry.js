function ViewModel() {
    var vm = this;

    var cw = this.commentwriter = new Editor.CommentWriter();
    this.comment_on_checklist_item = function(data, e) {
        var label = e.currentTarget.parentElement.querySelector('label').textContent.trim();
        cw.writingComment(true);
        cw.add_text('<h3>'+label+'</h3>\n<p></p>\n');
    }
}

$(document).ready(function() {
    var vm = new ViewModel();
    ko.applyBindings(vm);
});

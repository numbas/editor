function ViewModel() {
    this.commentwriter = new Editor.CommentWriter();
}

$(document).ready(function() {
    var vm = new ViewModel();
    ko.applyBindings(vm);
});

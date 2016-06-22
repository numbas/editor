function ViewModel() {
    this.commentwriter = new Editor.CommentWriter();
}

var viewModel;
$(document).ready(function() {
    viewModel = new ViewModel();
    ko.applyBindings(viewModel);
});

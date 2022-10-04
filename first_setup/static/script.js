function toggle_dev_questions() {
  const dev = document.getElementById('question-DEBUG').checked;
  
  document.body.classList.toggle('is-dev',dev);
}

toggle_dev_questions();

document.getElementById('question-DEBUG').addEventListener('change', toggle_dev_questions);

function toggle_superuser_questions() {
  const superuser = !document.getElementById('question-SU_CREATE').checked;
  
  document.body.classList.toggle('is-superuser',superuser);
}

toggle_superuser_questions();

document.getElementById('question-SU_CREATE').addEventListener('change', toggle_superuser_questions);

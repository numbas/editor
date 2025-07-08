Numbas.queueScript('go',['start-exam', 'display'], async function() {
    const params = new URLSearchParams(location.search);

    const locale = params.get('locale') || 'en-GB';

    Numbas.locale.set_preferred_locale(locale);

    const container = document.getElementById('with-stylesheet');

    const root_element = document.createElement('numbas-exam');
    root_element.setAttribute('source_url', params.get('source_url'));
    root_element.setAttribute('extensions', params.get('extensions'));
    container.append(root_element);
});

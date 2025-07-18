Numbas.queueScript('go',['start-exam', 'display'], async function() {
    const params = new URLSearchParams(location.search);

    const locale = params.get('locale') || 'en-GB';

    Numbas.locale.set_preferred_locale(locale);

    const container = document.getElementById('with-stylesheet');

    const root_element = document.createElement('numbas-exam');
    root_element.setAttribute('source_url', params.get('source_url'));
    const extension_data_script = document.createElement('script');
    extension_data_script.setAttribute('type', 'application/json');
    extension_data_script.setAttribute('slot','extension-data');
    extension_data_script.textContent = params.get('extensions');
    root_element.append(extension_data_script);
    container.append(root_element);
});

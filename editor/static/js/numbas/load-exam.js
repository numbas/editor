Numbas.queueScript('go',['start-exam', 'display'], async function() {
    const params = new URLSearchParams(location.search);
    const source_url = params.get('source_url');
    const extension_data = params.get('extensions');

    const locale = params.get('locale') || 'en-GB';

    Numbas.locale.set_preferred_locale(locale);

    const container = document.getElementById('with-stylesheet');
    if(container) {
        const root_element = document.createElement('numbas-exam');
        root_element.setAttribute('source_url', source_url);

        const extension_data_script = document.createElement('script');
        extension_data_script.setAttribute('type', 'application/json');
        extension_data_script.setAttribute('slot','extension-data');
        extension_data_script.textContent = extension_data;
        root_element.append(extension_data_script);

        container.append(root_element);
    }

    Numbas.get_exam_init_data = function() {
        return {source_url, extension_data};
    }
});

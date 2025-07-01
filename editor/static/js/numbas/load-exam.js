Numbas.queueScript('go',['start-exam', 'display'], async function() {
    const params = new URLSearchParams(location.search);

    const locale = params.get('locale') || 'en-GB';

    Numbas.locale.set_preferred_locale(locale);

    const root_element = document.createElement('numbas-exam');
    document.getElementById('with-stylesheet').append(root_element);
    console.log('appended');

    const options = {
        exam_url: params.get('source_url'),
        element: root_element
    };

    const exam_data = await Numbas.load_exam(options);

    const extension_data = JSON.parse(params.get('extensions'));

    for(let extension of exam_data.extensions) {
        const data = extension_data[extension];
        for(let js of data.javascripts) {
            const script = document.createElement('script');
            script.src = `${data.root}/${js}`;
            document.head.appendChild(script);
        }
        for(let css of data.stylesheets) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = `${data.root}/${css}`;
            document.head.appendChild(link);
        }
    }
});

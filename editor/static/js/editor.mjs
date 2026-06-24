export function tryGetAttribute(data, name) {
    if(name in data) {
        return data[name];
    } else {
        name = name.toLowerCase();
        for(var x in data) {
            if(x.toLowerCase() == name) {
                return data[x];
            }
        }
    }
}


/** Try to load the given attribute(s) from data into obj
 * @param {Object} data
 * @param {String|Array.<String>} attr - the name of the attribute to load, or a list of names
 * @param {Object} obj - the object to load the attribute into
 * @param {String|Array.<String>} [altname] - the name(s) of the attribute to set in the destination object
 */
export function tryLoad(data, attr, obj, altname) {
    if(!data) {
        return;
    }

    if(attr instanceof Array) {
        altname = altname || [];
        for(var i=0;i<attr.length;i++) {
            tryLoad(data, attr[i], obj, altname[i] || attr[i]);
        }
    } else {
        altname = altname || attr;

        var value = tryGetAttribute(data,attr);
        if(value !== undefined) {
            if(altname in obj && typeof obj[altname] == 'string') {
                value += '';
            }
            obj[altname] = value;
        }
    }
}


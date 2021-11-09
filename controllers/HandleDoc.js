const product_type = require('../config/product_type')

module.exports = function HandleDoc(type, listDoc) {
    try {
        const newDoc = []
        const product = product_type.filter(p => String(p.product_code) == String(type))
        if (product.length !== 0) {
            product[0].document_collecting.map(p => {
                p.doc_list.map(pp => {
                    const check = listDoc.filter(l => l.file_type == pp.doc_type)
                    if (check.length != 0) {
                        newDoc.push(check[0])
                    } else {
                        newDoc.push({
                            file_name: null,
                            file_type: pp.doc_type
                        })
                    }
                })
            })
        }
        return newDoc
    } catch (error) {
        return error
    }
};
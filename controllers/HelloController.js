class HelloController {

    static async welcome(req, res, next) {
        try {

            return res.json({ messenge: new Date().getTime() })
        } catch (error) {
            console.log(error)
            console.log('error')
        }
    }
}

module.exports = HelloController

const cors = require("cors");
const express = require("express"),
app = express();
const bodyParser = require("body-parser");
const errorHandler = require("./_middleware/error-handler");
const DSAController = require("./controllers/DSAController")
const path = require('path')
require('dotenv').config()

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(cors());

const port = process.env.PORT || 3001;
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use("/download", async function (req, res) {
    try {
        const fileBuffer = await DSAController.readFileBufferFromAWS(req.url)
        const name = req.url.split("/").pop()
        res.attachment(name)
        return res.send(fileBuffer)
    } catch (error) {
        console.log(error);
        return res.status(400).json(
            commonResponse(400, error + "", {}, req)
        )
    }
    // let file = __dirname + req.url;
    // res.download(file);
});
let routes = require("./routes/appRoutes");
const { commonResponse } = require("./models/Response");
routes(app);
app.use(errorHandler);

app.listen(port, () => console.log(`Listening on port ${port}`));

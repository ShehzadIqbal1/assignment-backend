const mongoose = require("mongoose");


const siteConfigSchema = new mongoose.Schema(
{
    tag:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
    },


    activeHome:{
        type:String,
        enum:[
            "home",
            "home-1"
        ],
        default:"home"
    }

},
{
    timestamps:true
});


module.exports =
mongoose.model(
    "SiteConfig",
    siteConfigSchema
);
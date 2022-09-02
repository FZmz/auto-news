var fs = require("fs");
let data = []
new Promise((resolve,reject)=>{
    let resData = []
    fs.readdir("./img/common/",function(err, files){
        if (err) {
            return console.error(err);
        }
        resData = files;
        resolve(resData)
     });
}).then((res)=>{
    console.log(res);
})
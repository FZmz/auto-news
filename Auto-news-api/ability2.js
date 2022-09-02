let request = require("request");
let cheerio = require("cheerio");
let fs = require("fs");
let axios = require('axios');
const path = require("path");
const { resolve } = require("path");
let BASE_URL = "https://mp.weixin.qq.com";
let swiper_img_list = []; // 轮播图列表
let img_list = []; // 普通展示图片列表
let TitleDom = ''; // 新闻标题
let secondDomList = []; // 二级标题列表
let newsContent = []; // 此新闻整体的DOM树
let newsContentDom = [];
let imgCount = 1;
let swiper_img_list_dir = [];
let img_list_dir = [];
let $1 = cheerio.load('<div class="container"><div class="detail-container"></div></div>');
let contentNodeList = $1('.detail-container');
let $swiper = cheerio.load('<div class="swiper-container"><div class="swiper-wrapper"></div></div>');
let swiperDom = $swiper('.swiper-wrapper');
// 获取处理后的dom树 首先得先处理 从上到下遍历dom树
async function downLoadPicture(img_url, dic_path, type) {
  const target_path = path.resolve(__dirname, `./img/${dic_path}/${dic_path}${imgCount++}.${type}`);
  const response = await axios.get(img_url, { responseType: 'stream' });
  await response.data.pipe(fs.createWriteStream(target_path));
}
function readdirs(dir) {
  return new Promise((resolve,reject)=>{
    fs.readdir(`./img/${dir}/`, function (err, files) {
      let tempData = new Array(files.length).fill(0)
      if (err) {
        return console.error(err);
      }
      files.forEach((el,index)=>{
        let num =  parseInt(el.slice(6,-4)) - 1;
        tempData[num] = files[index];
      })
      resolve(tempData)
    });
  }).then((res)=>{
    return res;
  })

  console.log(data);
  return data;
}
new Promise(async (resolve, reject) => {
  request(
    "https://mp.weixin.qq.com/s/yUaGdokYWkPJjr7lgJhMrQ",
    async (err, result) => {
      if (err) console.log(err);
      // 选择对应的DOM内容区域,拿到我们想要爬取的内容信息
      let $ = cheerio.load(result.body);
      // $('#page-content svg svg').each((index,element)=>{
      //   console.log($(element).css('background-image'))
      // })
      $('#img-content section').each((index, element) => {
        if ($(element).children()[0].tagName != 'section') {
          // 过滤掉为空的情况
          // if ($(element).children().html() || $(element).html()) {
          // 注意别过滤掉svg和img
          if ($(element).children()[0].tagName == 'img' || $(element).children()[0].tagName == 'svg') {
            newsContent.push($($(element).children()[0]).parent().html());
          } else {
            newsContent.push($(element).html());
          }
          // }
        }
      })
      // 过滤newsContent
      newsContent = newsContent.filter(function (e) {
        return !e.startsWith('<br');
      });
      // // 字符串转dom
      // // p标签去除自身style属性
      newsContent.forEach((e, index) => {
        let $2 = cheerio.load(e)
        if (e.includes('<img')) {
          contentNodeList.append($2('img'))
        } else if (e.includes('<svg')) {
          contentNodeList.append($2('svg'))
        } else if (e.includes('<p')) {
          contentNodeList.append($2('p'))
        }
      })
      contentNodeList.children().each((i, el) => {
        if (el.tagName == 'p') {
          $(el).removeAttr('style');
        } else if (el.tagName == 'img') {
          let img_url = $(el).attr('data-src');
          $(el).removeAttr('data-w');
          $(el).removeAttr('data-src');
          $(el).removeAttr('data-ratio');
          $(el).removeAttr('class');
          $(el).attr('style', 'width:80%;display:block');
          $(el).attr('src', img_url);
        } else if (el.tagName == 'svg') {
          if ($(el).css('background-image')) {
            let $swiperSlide = cheerio.load('<div class="swiper-slide"></div>');
            let swiperSlideDom = $swiperSlide('.swiper-slide');
            let $img = cheerio.load('<img style="width:80%;display:block" />');
            let imgDom = $img('img');
            let img_url = $(el).css('background-image').replace('url(\"', '').replace('\")', '');
            imgDom.attr('src', img_url);
            swiperSlideDom.append(imgDom);
            swiperDom.append(swiperSlideDom);
          }
        }
      })
      //  把轮播图插入
      if (contentNodeList.find('svg')) {
        $(contentNodeList.find('svg')[0]).after($swiper('.swiper-container'));
        contentNodeList.find('svg').remove()
      }
      // 下载图片
      // 1.生成图片地址列表
      $1('.container img').each((index, el) => {
        if ($(el).parent().attr('class') == 'swiper-slide') {
          swiper_img_list.push($(el).attr('src'))
        } else {
          img_list.push($(el).attr('src'))
        }
      })
      // 2.请求并下载图片资源
      swiper_img_list.forEach(async (e) => {
        let type = 'jpg';
        if (e.includes('gif')) {
          type = 'gif'
        } else if (e.includes('png')) {
          type = 'png'
        }
        await downLoadPicture(e, 'swiper', type)
      })
      imgCount = 1;
      img_list.forEach(async (e) => {
        let type = 'jpg';
        if (e.includes('gif')) {
          type = 'gif'
        } else if (e.includes('png')) {
          type = 'png'
        }
        await downLoadPicture(e, 'common', type)
      });
      (async function () {
        swiper_img_list_dir = await readdirs('swiper');
        img_list_dir = await readdirs('common');
        console.log(swiper_img_list_dir);
        let swiperIndex = 0;
        let commonIndex = 0;
        // 获取两个文件夹下的图片 获取后赋值
        $1('.container img').each((index, el) => {
          if ($(el).parent().attr('class') == 'swiper-slide') {
            $(el).attr('src', './img/swiper/' + swiper_img_list_dir[swiperIndex++]);
          } else {
            $(el).attr('src', './img/common/' + img_list_dir[commonIndex++]);
          }
        })
        resolve($1('.container').html());
      })()
    }
  );
}).then((res) => {
  fs.writeFile('./index.html', res, 'utf-8', (err) => {
    if (err) throw err;
    else console.log('自动化程序生成成功！')
  })
})



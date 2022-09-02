let request = require("request");
let cheerio = require("cheerio");
let fs = require("fs");
let BASE_URL = "https://mp.weixin.qq.com";
let swiper_img_list = []; // 轮播图列表
let img_list = []; // 普通展示图片列表
let TitleDom = ''; // 新闻标题
let secondDomList = []; // 二级标题列表
let newsContent = []; // 此新闻整体的DOM树
let newsContentDom = [];
// 获取处理后的dom树 首先得先处理 从上到下遍历dom树
/* 
 * 
*/
new Promise((resolve, reject) => {
  request(
    "https://mp.weixin.qq.com/s/yUaGdokYWkPJjr7lgJhMrQ",
    (err, result) => {
      if (err) console.log(err);
      // 选择对应的DOM内容区域,拿到我们想要爬取的内容信息
      let $ = cheerio.load(result.body);
      // $('#page-content svg svg').each((index,element)=>{
      //   console.log($(element).css('background-image'))
      // })
      $('#img-content section').each((index, element) => {
          // 过滤掉为空的情况
          if ($(element).children().html() || $(element).html()) {
            // 注意别过滤掉svg和img
            if ($(element).children()[0].tagName == 'img' || $(element).children()[0].tagName == 'svg') {
              newsContent.push($($(element).children()[0]).parent().html());
            } else {
              newsContent.push($(element).html());
            }
          }
      })
      // 过滤newsContent
      newsContent = newsContent.filter(function (e) {
        return !e.startsWith('<br');
      });
      // 字符串转dom
      // p标签去除自身style属性
      let $1 = cheerio.load('<div class="container"><div class="detail-container"></div></div>');
      let contentNodeList = $1('.detail-container');
      let $swiper = cheerio.load('<div class="swiper-container"><div class="swiper-wrapper"></div></div>');
      let swiperDom = $swiper('.swiper-wrapper');
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
            imgDom.attr('src', $(el).css('background-image'));
            swiperSlideDom.append(imgDom);
            swiperDom.append(swiperSlideDom);
          }
        }
      })
      // 把轮播图插入
      if (contentNodeList.find('svg')) {
        $(contentNodeList.find('svg')[0]).after( $swiper('.swiper-container'));
        contentNodeList.find('svg').remove()
      }
      console.log($1('.container').html());
      resolve($1('.container').html())
    }
  );
}).then((res)=>{
  fs.writeFile('./index.html',res,'utf-8',(err)=>{
    if (err) throw err;
    else console.log('自动化程序生成成功！')
  })
})


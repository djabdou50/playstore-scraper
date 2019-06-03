const Nightmare = require('nightmare')
const cheerio = require('cheerio');
var vo = require('vo');
const { Parser } = require('json2csv');
const fs = require('fs')

const nightmare = Nightmare({ openDevTools: {
        mode: 'detach'
    },
    show: false
})



let scrapeStore =  function * (){

    nightmare
        .goto('https://play.google.com/store/apps/details?id=com.saphir.cammobile&showAllReviews=true')
        .wait('h3')


    var previousHeight, currentHeight=0;

    let limit = 500;
    let ett = 0;
    while(previousHeight !== currentHeight) {
        ett++;

        console.log('load more')

        if(ett <= limit ){

            previousHeight = currentHeight;
            var currentHeight = yield nightmare.evaluate(function() {
                return document.body.scrollHeight;
            });


            // yield nightmare.scrollTo(currentHeight, 0)
            //     .wait(5000);

            yield nightmare.exists('span.RveJvd').then( (result) => {
                if(result){
                    nightmare.click('span.RveJvd').wait(5000);
                }else {
                    nightmare.scrollTo(currentHeight, 0).wait(5000);
                }
            })
        }else {

             currentHeight = previousHeight
        }

    }


    nightmare.evaluate(() => {
        let data = document.querySelector('h3').nextSibling.childNodes; //document.querySelectorAll('.d15Mdf');
        let entries = [];

        for (let i = 0; i < data.length; i++) {
            let revData = {};
            let review = data[i].querySelector(':nth-child(1)')

            revData.user = review.querySelector(':nth-child(2) > div:nth-child(1) > div:nth-child(1) > span').textContent;
            revData.date = review.querySelector(':nth-child(2) > div:nth-child(1) > div > div > span:nth-child(2) ').textContent;
            // revData.text = review.querySelector('.UD7Dzf').textContent.replace(/[\n\r]+|[\s]{2,}/g, ' ').trim();
            revData.review = review.querySelector(':nth-child(2) > div:nth-child(2) > span').textContent.replace(/[\n\r]+|[\s]{2,}/g, ' ').trim();

            entries.push(revData)
        }

        return entries

        })
        // .end()
        .then( reviews => {
            // console.log(reviews)

            const fields = ['date', 'review', 'user'];
            const json2csvParser = new Parser({ fields });
            const csv = json2csvParser.parse(reviews);

            // console.log(csv)

            fs.writeFileSync('datareviews.csv', csv);

            console.log("file done")


        })
        .catch(error => {
            console.error('Search failed:', error)
        });

}

vo(scrapeStore)(function (err) {
    console.log(err)
    console.log('done')
});


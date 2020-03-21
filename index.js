const _ = require('lodash')
const axios = require('axios')
const Crawler = require('crawler')
const moment = require('moment')

const apiQuery = {
  // ProfilePage: https://www.instagram.com/${username}
  ProfilePage: {
    query_hash: 'e769aa130647d2354c40ea6a439bfc08',
    variables:  {
      id:    '', // Instagram 的 user id || required
      first: 12, // 每次要拉幾筆資料 || required
      after: '', // 前一次拉 api 的 page_info.end_cursor 要填入在這 || required
    },
  },
  // FeedPage、ExploreLandingPage 需要登入才可以使用
  // FeedPage: https://www.instagram.com
  // FeedPage: {
  //   query_hash: '6b838488258d7a4820e48d209ef79eb1',
  //   variables:  {
  //     cached_feed_item_ids:   [],
  //     fetch_media_item_count: 12,
  //     fetch_comment_count:    4,
  //     fetch_like:             3,
  //     has_stories:            false,
  //     has_threaded_comments:  true,
  //   },
  // },
  // ExploreLandingPage: https://www.instagram.com/explore
  // ExploreLandingPage: {
  //   query_hash: 'ecd67af449fb6edab7c69a205413bfa7',
  //   variables:  {
  //     first: 24,
  //     after: 1, // after++
  //   },
  // },
  // PostPage: https://www.instagram.com/p/${shortcode}
  PostPage: {
    query_hash: '77fa889ea175f55eea62d9285abc769d',
    variables:  {
      shortcode:             '',
      child_comment_count:   3,
      fetch_comment_count:   40,
      parent_comment_count:  24,
      has_threaded_comments: true,
    },
  },
  // TagPage: https://www.instagram.com/explore/tags/${name}
  TagPage: {
    query_hash: '7dabc71d3e758b1ec19ffb85639e427b',
    variables:  {
      tag_name: '', // tag name 的名稱 || required
      first:    12, // 每次要拉幾筆資料 || required
      after:    '', // 前一次拉 api 的 page_info.end_cursor 要填入在這 || required
    },
  },
  // Comment: 訪問 PostPage 的推文可拉裡面的留言～
  // Comment: {
  //   query_hash: 'bc3296d1ce80a24b1b6e40b1e72903f5',
  //   variables:  {
  //     shortcode: '', // 推文 shortcode
  //     first:     12, // 每次要拉幾筆資料 || required
  //     after:     '', // 前一次拉 api 的 page_info.end_cursor 要填入在這 || required
  //   },
  // },
  // ThreadComment: Comment 的回覆
  // 暫時不弄～
  // ThreadComment: {
  //   query_hash: '',
  //   variables:  {

  //   },
  // },
}

const dumpTimeline = data => {
  data.edges.forEach(edge => {
    console.log('使用者名稱: ', _.get(edge, 'node.owner.username', null))
    console.log('Instagram ID: ', _.get(edge, 'node.owner.id', 0))
    console.log('推文代碼: ', _.get(edge, 'node.shortcode', null))
    console.log('圖片連結: ', _.get(edge, 'node.display_url', null))
    console.log('內容: ', _.get(edge, 'node.edge_media_to_caption.edges[0].node.text', null))
    console.log('留言數: ', _.get(edge, 'node.edge_media_to_comment.count', 0))
    console.log('發布時間: ', moment(_.get(edge, 'node.taken_at_timestamp', 0) * 1000).format('YYYY-MM-DD'))
    console.log('愛心數: ', _.get(edge, 'node.edge_liked_by.count', 0) || _.get(edge, 'node.edge_media_preview_like.count', 0))
    console.log('-------------------------------------------------------')
    console.log('-------------------------------------------------------')
  })
}

// const dumpComment = data => {
//   console.log('推文代碼: ', _.get(data, 'shortcode', null))
//   data.edges.forEach(edge => {
//     console.log('留言內容: ', _.get(edge, 'node.text', null))
//     console.log('留言時間: ', moment(_.get(edge, 'node.created_at', 0) * 1000).format('YYYY-MM-DD'))
//     console.log('留言者 Instagram ID: ', _.get(edge, 'node.owner.id', 0))
//     console.log('留言者名稱: ', _.get(edge, 'node.owner.username', null))
//     console.log('留言者頭像: ', _.get(edge, 'node.owner.profile_pic_url', null))
//     console.log('留言愛心數: ', _.get(edge, 'node.edge_liked_by.count', 0))
//     console.log('-------------------------------------------------------')
//     console.log('-------------------------------------------------------')
//   })
// }

const loadInstagramAPI = ({ type, query_hash, variables }) => axios.get('https://www.instagram.com/graphql/query/', {
  params: { query_hash, variables },
}).then(async res => {
  await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * Math.floor(3))))
  switch (type) {
    case 'ProfilePage':
    case 'TagPage':
      const data = _.get(res, 'data.data.user.edge_owner_to_timeline_media', null) || _.get(res, 'data.data.hashtag.edge_hashtag_to_media', null)
      dumpTimeline(data)
      if (data.page_info.has_next_page) {
        await loadInstagramAPI({
          type,
          query_hash,
          variables: JSON.stringify({
            ...JSON.parse(variables),
            after: data.page_info.end_cursor,
          }),
        })
      }
      break
    // case 'Comment':
    //   const comment = _.get(res, 'data.data.shortcode_media.edge_media_to_parent_comment', null)
    //   dumpComment({
    //     ...comment,
    //     shortcode: JSON.parse(variables).shortcode,
    //   })
    //   if (comment.page_info.has_next_page) {
    //     await loadInstagramAPI({
    //       type,
    //       query_hash,
    //       variables: JSON.stringify({
    //         ...JSON.parse(variables),
    //         after: comment.page_info.end_cursor,
    //       }),
    //     })
    //   }
    //   break
    default:
      break
  }
}).catch(err => {
  throw new Error(err)
})

new Crawler({
  callback (error, res, done) {
    if (error) throw new Error(error)

    const { $ } = res
    if (!$('body').html().includes('window._sharedData')) {
      console.log('page not found')
    } else {
      $('script').each((index, scirpt) => {
        if ($(scirpt).html().match(/^window._sharedData = /)) {
          console.log('window._sharedData get found')
          const initData = JSON.parse($(scirpt).html().replace('window._sharedData = ', '').replace(/;$/, '')).entry_data
          Object.keys(initData).forEach(type => {
            console.log('data type:', type)
            switch (type) {
              case 'ProfilePage':
                const { id, edge_owner_to_timeline_media } = initData[type][0].graphql.user
                dumpTimeline(edge_owner_to_timeline_media)
                loadInstagramAPI({
                  type,
                  query_hash: apiQuery[type].query_hash,
                  variables:  JSON.stringify({
                    ...apiQuery[type].variables,
                    id,
                    after: edge_owner_to_timeline_media.page_info.end_cursor,
                  }),
                })
                break
              case 'TagPage':
                const { edge_hashtag_to_top_posts, edge_hashtag_to_media, name } = initData[type][0].graphql.hashtag
                dumpTimeline(edge_hashtag_to_top_posts)
                dumpTimeline(edge_hashtag_to_media)
                loadInstagramAPI({
                  type,
                  query_hash: apiQuery[type].query_hash,
                  variables:  JSON.stringify({
                    ...apiQuery[type].variables,
                    tag_name: name,
                    after:    edge_hashtag_to_media.page_info.end_cursor,
                  }),
                })
                break
              // case 'PostPage':
              //   const { edge_media_to_parent_comment, shortcode } = initData[type][0].graphql.shortcode_media
              //   dumpComment({
              //     ...edge_media_to_parent_comment,
              //     shortcode,
              //   })
              //   loadInstagramAPI({
              //     type:       'Comment',
              //     query_hash: apiQuery.Comment.query_hash,
              //     variables:  JSON.stringify({
              //       shortcode,
              //       first: 12,
              //       after: edge_media_to_parent_comment.page_info.end_cursor,
              //     }),
              //   })
              //   break
              default:
                break
            }
          })
        }
      })
    }
    console.log('crawler is finish.')
    done()
  },
})
  // .queue('https://www.instagram.com/explore/tags/redcircle%E8%88%8C%E5%8F%A3%E9%A4%90%E9%85%92%E6%B2%99%E9%BE%8D')
  .queue('https://www.instagram.com/misa72600/')
  // .queue('https://www.instagram.com/p/B8tNI9sJqJp')

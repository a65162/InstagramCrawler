const _ = require('lodash')
const axios = require('axios')
const Crawler = require('crawler')

const apiQuery = {
  ProfilePage: {
    query_hash: 'e769aa130647d2354c40ea6a439bfc08',
    variables:  {
      id:    '', // Instagram 的 user id
      first: 12, // 每次要拉幾筆資料
      after: '', // 前一次拉 api 的 page_info.end_cursor 要填入在這
    },
  },
  // FeedPage、ExploreLandingPage 需要登入才可以使用
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
  // ExploreLandingPage: {
  //   query_hash: 'ecd67af449fb6edab7c69a205413bfa7',
  //   variables:  {
  //     first: 24,
  //     after: 1, // after++
  //   },
  // },
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
  TagPage: {
    query_hash: '7dabc71d3e758b1ec19ffb85639e427b',
    variables:  {
      tag_name: '', // tag name 的名稱
      first:    12, // 每次要拉幾筆資料
      after:    '', // 前一次拉 api 的 page_info.end_cursor 要填入在這
    },
  },
}

const loadTimelineList = ({ type, query_hash, variables }) => axios.get('https://www.instagram.com/graphql/query/', {
  params: { query_hash, variables },
}).then(async res => {
  await new Promise(resolve => setTimeout(resolve, 3000))
  switch (type) {
    case 'ProfilePage':
    case 'TagPage':
      const data = _.get(res, 'data.data.user.edge_owner_to_timeline_media', null) || _.get(res, 'data.data.hashtag.edge_hashtag_to_media', null)
      console.log('get data by api', data)
      variables.after = data.page_info.end_cursor
      if (data.page_info.has_next_page) await loadTimelineList({ type, query_hash, variables })
      break
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
                console.log(edge_owner_to_timeline_media)
                loadTimelineList({
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
                console.log('top posts in tag', edge_hashtag_to_top_posts)
                console.log('recently post in tag', edge_hashtag_to_media)
                loadTimelineList({
                  type,
                  query_hash: apiQuery[type].query_hash,
                  variables:  JSON.stringify({
                    ...apiQuery[type].variables,
                    tag_name: name,
                    after:    edge_hashtag_to_media.page_info.end_cursor,
                  }),
                })
                break
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
}).queue('https://www.instagram.com/explore/tags/aa/')

const fs = require('fs')
const path = require('path')
const _ = require('lodash')
const axios = require('axios')

const apiQuery = {
  user: {
    query_hash: 'e769aa130647d2354c40ea6a439bfc08',
    variables:  {
      id:    '', // Instagram 的 user id || required
      first: 50, // 每次要拉幾筆資料 || required
      after: undefined, // 前一次拉 api 的 page_info.end_cursor 要填入在這 || required
    },
  },
  hashtag: {
    query_hash: '7dabc71d3e758b1ec19ffb85639e427b',
    variables:  {
      tag_name: '', // tag name 的名稱 || required
      first:    50, // 每次要拉幾筆資料 || required
      after:    undefined, // 前一次拉 api 的 page_info.end_cursor 要填入在這 || required
    },
  },
  comment: {
    query_hash: 'bc3296d1ce80a24b1b6e40b1e72903f5',
    variables:  {
      shortcode: '', // 推文 shortcode
      first:     50, // 每次要拉幾筆資料 || required
      after:     undefined, // 前一次拉 api 的 page_info.end_cursor 要填入在這 || required
    },
  },
  threadedComment: {
    query_hash: '1ee91c32fc020d44158a3192eda98247',
    variables:  {
      comment_id: '', // 留言的 id
      first:      50, // 每次要拉幾筆資料 || required
      after:      undefined, // 前一次拉 api 的 page_info.end_cursor 要填入在這 || required
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
  // PostPage: {
  //   query_hash: '77fa889ea175f55eea62d9285abc769d',
  //   variables:  {
  //     shortcode:             '',
  //     child_comment_count:   3,
  //     fetch_comment_count:   40,
  //     parent_comment_count:  24,
  //     has_threaded_comments: true,
  //   },
  // },
}

const delayRequest = timing => {
  const delay = Math.floor(Math.random() * Math.floor(timing))
  return delay < 3000 ? delayRequest(timing) : delay
}

const loadInstagramAPI = ({ type, query_hash, variables }) => axios.get('https://www.instagram.com/graphql/query/', {
  params: {
    query_hash,
    variables,
  },
}).then(async res => {
  await new Promise(resolve => setTimeout(resolve, delayRequest(5000)))
  switch (type) {
    case 'user':
    case 'hashtag':
      const { edge_owner_to_timeline_media, edge_hashtag_to_media } = _.get(res, 'data.data', {})[type]
      const timelineList = edge_owner_to_timeline_media || edge_hashtag_to_media
      console.log('還有下一頁的貼文資料嗎？', timelineList.page_info.has_next_page)
      console.log('下載下一頁貼文需要的 token：', timelineList.page_info.end_cursor)
      if (timelineList.page_info.has_next_page) {
        timelineList.edges.push(
          ...await loadInstagramAPI({
            type,
            query_hash,
            variables: JSON.stringify({
              ...JSON.parse(variables),
              after: timelineList.page_info.end_cursor,
            }),
          }),
        )
      }
      return timelineList.edges
    case 'comment':
      const { edge_media_to_parent_comment } = _.get(res, 'data.data', {}).shortcode_media
      console.log('還有下一頁的留言嗎？', edge_media_to_parent_comment.page_info.has_next_page)
      console.log('下載下一頁留言需要的 token：', edge_media_to_parent_comment.page_info.end_cursor)
      if (edge_media_to_parent_comment.page_info.has_next_page) {
        edge_media_to_parent_comment.edges.push(
          ...await loadInstagramAPI({
            type,
            query_hash,
            variables: JSON.stringify({
              ...JSON.parse(variables),
              after: edge_media_to_parent_comment.page_info.end_cursor,
            }),
          }),
        )
      }
      return edge_media_to_parent_comment.edges
    case 'threadedComment':
      const { edge_threaded_comments } = _.get(res, 'data.data', {}).comment
      console.log('還有下一頁的回覆嗎？', edge_threaded_comments.page_info.has_next_page)
      console.log('下載下一頁回覆需要的 token：', edge_threaded_comments.page_info.end_cursor)
      if (edge_threaded_comments.page_info.has_next_page) {
        edge_threaded_comments.edges.push(
          ...await loadInstagramAPI({
            type,
            query_hash,
            variables: JSON.stringify({
              ...JSON.parse(variables),
              after: edge_threaded_comments.page_info.end_cursor,
            }),
          }),
        )
      }
      return edge_threaded_comments.edges
  }
  return {
    error:   true,
    message: 'no data found',
  }
}).catch(err => {
  throw new Error(err)
})
// Example:
// user: https://www.instagram.com/kevin0204660/
// hashtag: https://www.instagram.com/explore/tags/%E4%B8%8A%E7%8F%AD%E4%B8%8D%E8%A6%81%E7%9C%8B
axios.get('https://www.instagram.com/kevin0204660/', {
  params: {
    __a: 1,
  },
}).then(async res => {
  const { data } = res
  for (const type of Object.keys(data.graphql)) {
    switch (type) {
      case 'user':
      case 'hashtag':
        const { id, name: tag_name, username } = data.graphql[type]
        const writePath = `${__dirname}/data/${type}`
        console.log('開始下載所有貼文囉😊😊😊')
        const timelines = await loadInstagramAPI({
          type,
          query_hash: apiQuery[type].query_hash,
          variables:  JSON.stringify({
            ...apiQuery[type].variables,
            id,
            tag_name,
          }),
        })
        console.log('貼文已經下載完畢😅😅😅')
        for (const timeline of timelines) {
          const { edge_media_to_comment, shortcode } = timeline.node
          if (edge_media_to_comment.count) {
            console.log('開始下載這一篇貼文的留言囉😊😊😊; shortcode: ', shortcode)
            edge_media_to_comment.edges = await loadInstagramAPI({
              type:       'comment',
              query_hash: apiQuery.comment.query_hash,
              variables:  JSON.stringify({
                ...apiQuery.comment.variables,
                shortcode,
              }),
            })
            console.log('這一篇貼文留言已經下載完畢😅; shortcode: ', shortcode)
          }

          if (edge_media_to_comment.edges) {
            for (const comment of edge_media_to_comment.edges) {
              const { edge_threaded_comments, id: comment_id } = comment.node
              if (edge_threaded_comments.count && edge_threaded_comments.page_info.has_next_page) {
                console.log('開始下載這一則留言的回覆囉😊😊😊; comment_id: ', comment_id)
                edge_threaded_comments.edges = await loadInstagramAPI({
                  type:       'threadedComment',
                  query_hash: apiQuery.threadedComment.query_hash,
                  variables:  JSON.stringify({
                    ...apiQuery.threadedComment.variables,
                    comment_id,
                  }),
                })
                console.log('這一則留言的回覆已經下載完畢😅; comment_id: ', comment_id)
              }
            }
          }
        }

        if (!fs.existsSync(writePath)) {
          console.log(`此 "${writePath}" 不存在`)
          console.log(`建立不存在的資料`)
          await fs.mkdirSync(writePath)
          console.log(`"${writePath}" 建立完畢`)
        }
        console.log(`將 "${username || tag_name}.json" 寫入到 "${writePath}" 的資料夾內`)
        await fs.writeFileSync(path.join(writePath, `${username || tag_name}.json`), JSON.stringify({
          edges: timelines,
        }))
        console.log(`"${username || tag_name}.json" 寫入完畢`)
        break
    }
  }
  // console.log(data)
})

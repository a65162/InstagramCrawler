1. 初始資料放在 window._shareData.entry_data
2. 之後的資料需要訪問 https://www.instagram.com/graphql/query/







API 參數說明
1. query_hash: 規則未知，目前是寫死的～，值是直接看 network
2. variables
  1. id: 觀看哪個使用者的 id，這個資料會在步驟一中可取得
  2. first: 一次要拿幾筆資料
  3. after: end_cursor的值 （（每筆 api 都會獲取 end_cursor 的值，這個會放在 page_info




  related: https://www.twblogs.net/a/5cfe1e58bd9eee14029ee3af
module.exports = {
  root:          true,
  extends:       [
    'airbnb-base'
  ],
  // add your custom rules here
  rules:         {
    'key-spacing':                      [2, {
      'align':
        'value'
    }],
    'object-curly-spacing':             [2, 'always', {
      'objectsInObjects':
        true
    }],
    'space-before-function-paren':      [2, {
      'anonymous': 'never',
      'named':     'always'
    }],
    'sort-imports':                     ['error', {
      'ignoreCase':            true,
      'memberSyntaxSortOrder': ['none', 'all', 'single', 'multiple']
    }],
    'keyword-spacing': ['error'],
    'quotes': ['error', 'single', { 'allowTemplateLiterals': true }],
    'no-alert': 'error',
    'camelcase': ['error', {
      'allow': [
        'edge_owner_to_timeline_media',
        'query_hash',
        'edge_web_feed_timeline',
        'cached_feed_item_ids',
        'fetch_media_item_count',
        'fetch_comment_count',
        'fetch_like',
        'has_stories',
        'has_threaded_comments',
        'edge_web_discover_media',
        'shortcode_media',
        'child_comment_count',
        'parent_comment_count',
        'tag_name',
        'edge_hashtag_to_media',
        'edge_hashtag_to_top_posts',
      ]
    }],
    'import/no-unresolved': [2, {
      ignore: ['^~']
    }],
    'no-bitwise': ['error', {
      'allow': ['~']
    }],
    'no-param-reassign': [2, { props: false }],
    'no-unused-expressions': [0],
    'no-restricted-globals': [0],
    'semi':  ['error', 'never', { 'beforeStatementContinuationChars': 'never'}],
    'func-names': ['error', 'as-needed'],
    'max-len': 0,
    'arrow-parens': [2, 'as-needed', { 'requireForBlockBody': false }],
    'prefer-destructuring': ['error', {'object': true, 'array': false}],
    'default-case': 0,
    'no-shadow': 0,
    'no-plusplus': 0,
    'no-case-declarations': 0,
    'object-shorthand': 0,
    'padded-blocks': ['error', 'never'],
    'no-console': 0,
    'no-param-reassign': 0,
    'space-unary-ops': 0,
    'radix': ['error', 'as-needed'],
    'import/extensions': ['error', 'ignorePackages', { 'js': 'never', 'vue': 'never' }],
    'no-restricted-syntax': 0,
    'no-await-in-loop': 0,
    'no-else-return': ['error', { 'allowElseIf': true }],
    'prefer-const': ['error', {'ignoreReadBeforeAssign': false}],
    'guard-for-in': 0,
    'import/order': ['error', {'groups': ['builtin', 'parent', 'index']}],
  },
}
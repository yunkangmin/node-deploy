const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];
const db = {};

const sequelize = new Sequelize(
  config.database, config.username, config.password, config,
);

db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.User = require('./user')(sequelize, Sequelize);
db.Post = require('./post')(sequelize, Sequelize);
db.Hashtag = require('./hashtag')(sequelize, Sequelize);
/*
  User 모델과 Post 모델은 1:N 관계에 있으므로 hasMany와 belongTo로 연결되어 있다.
  시퀄라이즈는 Post 모델에 userId 컬럼을 추가한다.
*/
db.User.hasMany(db.Post);
db.Post.belongsTo(db.User);
/*
  Post와 Hashtag 모델에서 N:M(또는 다대다) 관계가 나온다. 게시글 하나는 해시태그를  
  여러 개 가질 수 있고, 해시태그 하나도 게시글을 여러 개 가질 수 있다. 해시태그 검색  
  기능을 생각하면 된다. 따라서 게시글 모델과 해시태그 모델은 N:M 관계에 있다. 
  시퀄라이즈에서는 N:M 관계를 belongsToMany 메서드로 정의한다. 6.6.3절에서 다뤘다. 
  N:M 관계에서는 중간에 관계 테이블이 생성된다. 시퀄라이즈가 관계를 분석하여 PostHashtag라는  
  이름으로 테이블을 자동 생성한다. 컬럼 이름은 postId와 hashTagId이다.  
  Post와 Hashtag 모델의 관계에서 시퀄라이즈는 post 데이터에는 getHashtags, addHashtags 등의 
  메서드를 추가하고 hashtag 데이터에는 getPosts, addPosts 등의 메서드를 추가한다.
*/
db.Post.belongsToMany(db.Hashtag, { through: 'PostHashtag' });
db.Hashtag.belongsToMany(db.Post, { through: 'PostHashtag' });

/*
  같은 테이블끼리도 N:M 관계를 가질 수 있다. 팔로잉 기능도 N:M 관계이다. 사용자 한 명이 팔로워를  
  여러 명 가질 수도 있고, 여러 명을 팔로잉할 수도 있다. User 모델 간에 N:M 관계가 있는 것이다.
*/
db.User.belongsToMany(db.User, {
  foreignKey: 'followingId',
  as : 'Followers',
  through: 'Follow',
});
db.User.belongsToMany(db.User, {
  foreignKey: 'followerId',
  as: 'Followings',
  through: 'Follow',
});
module.exports = db;

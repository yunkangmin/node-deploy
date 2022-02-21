const local = require('./localStrategy');
const kakao = require('./kakaoStrategy');
const { User } = require('../models');

module.exports = (passport) => {
    /*
        serializeUser는 req.session 객체에 어떤 데이터를 저장할지 선택한다.
        매개변수로 user를 받아, done 함수에 두 번째 인자로 user.id를 넘기고 있다.  
        done 함수의 첫 번째 인자는 에러 발생 시 사용하는 것이므로 두 번째 인자가 중요하다.  
        세션에 사용자 정보를 모두 저장하면 세션의 용량이 커지고 데이터 일관성에 문제가  
        발생하므로 사용자의 아이디만 저장하라고 명령한 것이다. 
    */
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    /*
        deserializeUser는 매 요청 시 실행된다. passport.session() 미들웨어가 이 메서드를 호출한다.
        좀 전에 serializeUser에서 세션에 저장했던 아이디를 받아 데이터베이스에서 사용자 정보를 조회한다.  
        조회한 정보를 req.user에 저장하므로 앞으로 req.user를 통해 로그인한 사용자의 정보를 가져올 수 있다.  
    */
    passport.deserializeUser((id, done) => {
        /*
            세션에 저장된 아이디로 사용자 정보를 조회할 때 팔로잉 목록과 팔로워 목록도 같이 조회한다.
            include에서 계속 attributes를 지정하고 있는데, 이는 실수로 비밀번호를 조회하는 것을 방지하기
            위함이다.
            
            as는 models/index.js에서 테이블 관계설정시 설정한 이름이며 JOIN 시 사용할 이름이다.

            사용자의 팔로잉 목록과, 팔로워 목록을 조회할 때 getFollowers나 getFollowings로도 가능하지만
            원하는 컬럼만 가져오게 하기 위해 include를 사용한 듯하다(비밀번호를 가져오면 안되므로).
        */
        User.findOne({ where: { id },
                       include: [{
                           model: User,
                           attributes: ['id', 'nick'],
                           as: 'Followers',
                       }, {
                           model: User,
                           attributes: ['id', 'nick'],
                           as: 'Followings',
                       }],
                    })
                        .then(user => {done(null, user)})
                        .catch(err => done(err));
    });

    local(passport);
    kakao(passport);
};
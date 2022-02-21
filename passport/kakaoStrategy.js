const KakaoStrategy = require('passport-kakao').Strategy;

const { User } = require('../models');

module.exports = (passport) => {     
    /*
        로컬 로그인과 마찬가지로 카카오 로그인에 대한 설정을 한다. clientID는 카카오에서  
        발급해주는 아이디이다. 노출되지 않아야 하므로 process.env.KAKAO_ID로 설정했다.
        나중에 아이디를 발급받아 .env 파일에 넣을 것이다. callbackURL은 카카오로부터 
        인증 결과를 받을 라우터 주소이다. 라우터 작성 시 이 주소를 사용한다.  
    */
    passport.use(new KakaoStrategy({
        clientID: process.env.KAKAO_ID,
        callbackURL: '/auth/kakao/callback',
    }, async (accessToken, refreshToken, profile, done) => {
        console.log("profile");
        console.log(profile);
        try {
            /*
                먼저 기존에 카카오로 로그인한 사용자가 있는지 조회한다. 있다면 done 함수를 호출한다.
            */
            const exUser = await User.findOne({ where: { snsId: profile.id, provider: 'kakao'}});
            if (exUser) {
                done(null, exUser);
            /*
                없다면 회원가입을 진행한다. 카카오에서는 인증 후 callbackURL에 적힌 주소로 accessToken,  
                refreshToken과 profile을 보내준다. profile에 사용자 정보들이 들어 있다. 카카오에서  
                보내주는 것이므로 데이터는 console.log 메서드로 확인해보는 것이 좋다. profile 객체에서  
                원하는 정보를 꺼내와 회원가입을 하면 된다. 사용자를 생성한 뒤 done 함수를 호출한다.
            */
            } else {
                const newUser = await User.create({
                    email: profile._json && profile._json.kakao_account.email,
                    nick: profile.displayName,
                    snsId: profile.id,
                    provider: 'kakao',
                });
                done(null, newUser);
            }
        } catch (error) {
            console.error(error);
            done(error);
        }
    }));
};
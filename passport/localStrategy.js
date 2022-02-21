const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

const { User } = require('../models');

module.exports = (passport) => {
    /*
        LocalStrategy의 첫 번째 인자로 주어진 객체는 전략에 관한 설정을 하는 곳이다.
        usernameField와 passwordField에는 일치하는 req.body의 속성명을 적어주면 된다.
        req.body.email에 이메일이, req.body.password에 비밀번호가 담겨 들어오므로
        email과 password를 각각 넣어주었다.
    */
    passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
    /*
        실제 전략을 수행하는 async 함수이다. LocalStrategy의 두 번째 인자로 들어간다.
        위에서 넣어준 email과 password는 async 함수의 첫 번째와 두 번째 매개변수가 된다.
        세 번째 매개변수인 done 함수는 passport.authenticate의 콜백 함수이다.
    */
    }, async (email, password, done) => {
        try {
            const exUser = await User.findOne({ where: { email }});
            if (exUser) {
                const exUserPassword = exUser.password ? exUser.password : '';
                const result = await bcrypt.compare(password, exUserPassword);
                if (result) {
                    done(null, exUser);
                } else {
                    done(null, false, { message: '비밀번호가 일치하지 않습니다.'});
                }
            } else {
                done(null, false, { message: '가입되지 않은 회원입니다.'});
            }
        } catch (error) {
            console.error(error);
            done(error);
        }
    }));
};
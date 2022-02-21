const { createLogger, format, transports } = require('winston');

/*
    winston 패키지의 createLogger 메서드로 logger를 만든다. 인자로 logger에 대한 
    설정을 넣어줄 수 있다. 설정으로는 level, format, transports등이 있다.

    - level : 로그의 심각도를 의미한다. error, warn, info, verbose, debug, silly가 있다.
    심각도순(error가 가장 심각)이므로 위 순서를 참고하여 기록하길 원하는 유형의 로그를 
    고르면 된다. info를 고른 경우, info보다 심각한 단계의 로그(error, warn)도 함께 기록된다.   
    
    - format : 로그의 형식이다. json. label, timestamp, printf, simple, combine 등의 다양한  
    형식이 있다. 기본적으로는 JSON 형식으로 기록하지만 로그 기록 시간을 표시하려면 timestamp를  
    쓰는 것이 좋다. combine은 여러 형식을 혼합해서 사용할 때 쓴다. 활용법이 다양하므로 공식 문서를  
    참고하기 바란다.  

    - transports : 로그 저장 방식을 의미한다. new transports.File은 파일로 저장한다는 뜻이고,  
    new transports.Console은 콘솔에 출력한다는 뜻이다. 여러 로깅 방식을 동시에 사용할 수도 있다.   
    배포 환경이 아닌 경우 파일뿐만 아니라 콘솔에도 출력하도록 되어있다. 이 메서드들에도 level,  
    format 등을 설정할 수 있다. new transports.File인 경우 로그 파일의 이름인 filename도 설정할 수 있다.
*/
const logger = createLogger({
    level: 'info',
    format: format.json(),
    transports: [
        new transports.File({ filename: 'combined.log' }),
        new transports.File({ filename: 'error.log', level: 'error' }),
    ],
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new transports.Console({ format: format.simple() }));
}

module.exports = logger;
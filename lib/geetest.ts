import { createHmac } from "crypto";


export async function geeTestValidate(capResult: any) {
    const CAPTCHA_ID = process.env.NEXT_PUBLIC_GEETEST_CAPTCHA_ID ?? "";
    const CAPTCHA_KEY = process.env.GEETEST_CAPTCHA_KEY ?? "";
    const API_SERVER = "http://gcaptcha4.geetest.com";
    const API_URL = API_SERVER + "/validate" + "?captcha_id=" + CAPTCHA_ID;

    // 生成签名, 使用标准的hmac算法，使用用户当前完成验证的流水号lot_number作为原始消息message，使用客户验证私钥作为key
    // 采用sha256散列算法将message和key进行单向散列生成最终的 “sign_token” 签名
    // use lot_number + CAPTCHA_KEY, generate the signature
    var sign_token = hmac_sha256_encode(capResult?.lot_number, CAPTCHA_KEY);

    // 向极验转发前端数据 + “sign_token” 签名
    // send web parameter and “sign_token” to geetest server
    var datas = {
        'lot_number': capResult?.lot_number,
        'captcha_output': capResult?.captcha_output,
        'pass_token': capResult?.pass_token,
        'gen_time': capResult?.gen_time,
        'sign_token': sign_token
    };

    return post_form(datas, API_URL).then((result) => {
        // console.log('3333333', result);
        if(result['result'] == 'success'){
            console.log('validate success');
            return true;
        }else{
            console.log('validate fail:' + result['reason']);
            return false;
        }
    }).catch((err)=>{
        // 当请求Geetest服务接口出现异常，应放行通过，以免阻塞正常业务。
        // When the request geetest service interface is abnormal, it shall be released to avoid blocking normal business.
        console.log('Geetest server error:'+err);
        return true;
    })

}


// 生成签名
// Generate signature
function hmac_sha256_encode(value: string, key: string){
    return createHmac("sha256", key).update(value, "utf8").digest("hex");
}

// 发送post请求, 响应json数据如：{"result": "success", "reason": "", "captcha_args": {}}
// Send a post request and respond to JSON data, such as: {result ":" success "," reason ":" "," captcha_args ": {}}
async function post_form(datas: any, url: string){
    // 拼接查询参数
    const queryParams = new URLSearchParams(datas).toString();

    var options: RequestInit = {
        method: "POST",
        // body: JSON.stringify(datas),
        headers: {
            "Content-Type": "application/json",
        },
    };
    // console.log('-------', url, queryParams)

    var result = await fetch(`${url}&${queryParams}`, options);

    if(result.status != 200){
        // geetest服务响应异常
        // geetest service response exception
        console.log('Geetest Response Error, StatusCode:' + result.status);
        throw new Error('Geetest Response Error')
    }
    return result.json();
}
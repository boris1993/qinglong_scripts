#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# [task_local]
# 优豆云免费资源自动续期
# 0 0 * * * udouyun_renew.py, tag=优豆云免费资源自动续期, enabled=false

import os
import sys
import json
import requests

sys.tracebacklimit = 0
BASE_URL = "https://api.udouyun.com/www"
ENVIRONMENT_VARIABLE_USERNAME = "UDOUYUN_USERNAME"
ENVIRONMENT_VARIABLE_PASSWORD = "UDOUYUN_PASSWORD"

headers = {
    "Referer": "https://www.udouyun.com/",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36",
}


def main():
    if ENVIRONMENT_VARIABLE_USERNAME not in os.environ or ENVIRONMENT_VARIABLE_PASSWORD not in os.environ:
        raise Exception("环境变量" + ENVIRONMENT_VARIABLE_USERNAME +
                        "或" + ENVIRONMENT_VARIABLE_PASSWORD + "未设置")

    username = os.environ[ENVIRONMENT_VARIABLE_USERNAME]
    password = os.environ[ENVIRONMENT_VARIABLE_PASSWORD]

    session_id = login(username, password)
    submit_renewal(session_id)

    return


def login(username: str, password: str) -> str:
    url = BASE_URL + "/login.php"
    data = {
        "cmd": "login",
        "id_mobile": username,
        "password": password,
    }

    print("正在登陆" + username)
    response = requests.post(
        url=url,
        headers={
            **headers,
            **{'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
        },
        data=data)

    session_id = response.cookies.get("session_id")
    print("Session ID是" + session_id)

    return session_id


def submit_renewal(session_id):
    url = BASE_URL + "/renew.php"
    payload = {
        'cmd': 'free_delay_add',
        'ptype': 'vps',
        'url': 'http://t.csdn.cn/GksO8'
    }
    files = [
        ('yanqi_img',
         ('Screen Shot 2022-11-26 at 16.32.28.png',
          open('./resources/udouyun_screenshot.png', 'rb'), 'image/png'))]

    print("正在提交延期申请")
    response = requests.request(
        "POST",
        url=url,
        headers={
            **headers,
            **{"cookie": "session_id=" + session_id}
        },
        data=payload,
        files=files)

    response_json = json.loads(response.text)
    print("延期结果：" + response_json["msg"])

    return


if __name__ == "__main__":
    main()

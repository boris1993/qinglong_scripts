#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# [task_local]
# V2EX每日签到
# 10 8 * * * v2ex_daily_checkin.py, tag=V2EX每日签到, enabled=true

import os
import sys
import re
import requests

ENVIRONMENT_VARIABLE_COOKIE = "V2EX_COOKIE"
CHECKIN_URL = "https://www.v2ex.com/mission/daily"
REDEEM_COIN_URL = "https://www.v2ex.com/mission/daily/redeem?once="

REDEEM_URL_REGEX = r"mission\/daily\/redeem\?once=\d+"

ALREADY_CHECKED_IN_MESSAGE = "每日登录奖励已领取"
CHECKIN_SUCCESSFUL_MESSAGE = '已成功领取每日登录奖励'

if ENVIRONMENT_VARIABLE_COOKIE not in os.environ:
    raise Exception("缺少环境变量V2EX_COOKIE")

cookie = os.environ[ENVIRONMENT_VARIABLE_COOKIE]

headers = {
    'Cookie': cookie,
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36',
    'Referer': 'https://www.v2ex.com/',
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
    'accept-encoding': 'gzip, deflate, br',
    'accept-language': 'zh-CN,zh;q=0.9',
    'cache-control': 'no-cache',
    'Content-Type': 'text/html;charset=utf-8',
}

print("正在获取Redeem URL")

mission_page_response = requests.get(url=CHECKIN_URL, headers=headers)
mission_page_response_html = mission_page_response.text

if mission_page_response_html.find(ALREADY_CHECKED_IN_MESSAGE) != -1:
    print(ALREADY_CHECKED_IN_MESSAGE)
    sys.exit(0)

redeem_url = re.findall(REDEEM_URL_REGEX, mission_page_response_html)[0]
redeem_code = re.findall('\d+', redeem_url)[0]

redeem_url = "https://www.v2ex.com/mission/daily/redeem?once=" + redeem_code
print("签到URL是" + redeem_url)

print("正在签到")

redeem_response = requests.get(
    url=redeem_url,
    headers={
        **headers,
        "Referer": "https://www.v2ex.com/mission/daily"
    }
)

redeem_response_html = redeem_response.text

if redeem_response_html.find(CHECKIN_SUCCESSFUL_MESSAGE) == -1:
    print("签到失败，完整返回内容：")
    print(redeem_response_html)
    sys.exit(1)

print(CHECKIN_SUCCESSFUL_MESSAGE)
sys.exit(0)

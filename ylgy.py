#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# [task_local]
# Dler Cloud签到
# * * * * * ylgy.py, tag=羊了个羊刷分, enabled=false

import os
import random

import requests

BASE_URL = "https://cat-match.easygame2021.com/sheep/v1"
USER_AGENT = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.27(0x18001b36) NetType/WIFI Language/zh_CN"
REFERER = "https://servicewechat.com/wx141bfb9b73c970a9/17/page-frame.html"

ENVIRONMENT_USER_TOKEN = "ylgy_token"


def game_over(token: str) -> None:
    if token is None:
        print("传入的token为None，获取token可能出错")
        return

    print("正在完成羊群")
    game_over_url = \
        BASE_URL \
        + ("/game/game_over?rank_score=1&rank_state=1&rank_time=%s&rank_role=1&skin=1" % random.randint(1, 3600))

    response = requests.get(url=game_over_url, headers=build_headers(token))
    if is_response_successful(response):
        print("已完成羊群")

    print("正在完成话题")
    finish_topic_url = \
        BASE_URL \
        + ("/game/topic_game_over?rank_score=1&rank_state=1&rank_time=%s&rank_role=2&skin=1" % random.randint(1, 3600))
    response = requests.get(url=finish_topic_url, headers=build_headers(token))
    if is_response_successful(response):
        print("已完成话题")


def build_headers(token: str) -> dict:
    return {
        "t": token,
        "User-Agent": USER_AGENT,
        "Referer": REFERER
    }


def is_response_successful(response: requests.Response) -> bool:
    if not response.ok:
        print(response.text)
        return False

    if response.json()["err_code"] != 0:
        print(response.json()["err_msg"])
        return False

    return True


def main():
    if ENVIRONMENT_USER_TOKEN not in os.environ:
        raise Exception("环境变量 user_id_list 未设置")

    token = os.environ[ENVIRONMENT_USER_TOKEN]
    if token is None:
        return

    game_over(token)


if __name__ == '__main__':
    main()

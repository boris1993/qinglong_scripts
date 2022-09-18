#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# [task_local]
# Dler Cloud签到
# * * * * * ylgy.py, tag=羊了个羊刷分, enabled=true

import os
import random

import requests

BASE_URL = "https://cat-match.easygame2021.com/sheep/v1"
USER_AGENT = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.27(0x18001b36) NetType/WIFI Language/zh_CN"
REFERER = "https://servicewechat.com/wx141bfb9b73c970a9/17/page-frame.html"
# 一个写死的token，用于获取user_id关联的token
STATIC_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2OTQ0NDcwMDMsIm5iZiI6MTY2MzM0NDgwMywiaWF0IjoxNjYzMzQzMDAzLCJqdGkiOiJDTTpjYXRfbWF0Y2g6bHQxMjM0NTYiLCJvcGVuX2lkIjoiIiwidWlkIjoxMzI4NTcwMCwiZGVidWciOiIiLCJsYW5nIjoiIn0.GBWBUMtSP1Fo_KfWzsx7cVm0ffjKGkPfDCDpAMYWh-0"

ENVIRONMENT_USER_ID_LIST = "YLGY_USER_ID_LIST"


def get_user_id_list() -> list[str]:
    if ENVIRONMENT_USER_ID_LIST not in os.environ:
        raise Exception("环境变量 user_id_list 未设置")

    user_id_list = os.environ[ENVIRONMENT_USER_ID_LIST].split(",")
    user_id_list = list(map(lambda user_id: user_id.strip(), user_id_list))
    return user_id_list


def process(user_id) -> None:
    token = get_token(user_id)
    if token is None:
        return

    game_over(token)


def get_token(user_id: str) -> str | None:
    print("正在为UID " + user_id + " 获取wx_open_id")
    get_token_url = BASE_URL + "/game/user_info?uid=" + user_id
    response = requests.get(url=get_token_url, headers=build_headers())
    if not is_response_successful(response):
        return None

    wx_open_id = response.json()["data"]["wx_open_id"]

    print("正在为UID " + user_id + " 通过wx_open_id获取 token")
    tourist_login_url = BASE_URL + "/user/login_tourist"
    response = requests.post(url=tourist_login_url, json={"uuid": wx_open_id})
    if not is_response_successful(response):
        return None

    token = response.json()["data"]["token"]
    return token


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


def build_headers(token: str = None) -> dict:
    return {
        "t": token if token is not None else STATIC_TOKEN,
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
    user_id_list = get_user_id_list()
    for user_id in user_id_list:
        process(user_id)


if __name__ == '__main__':
    main()

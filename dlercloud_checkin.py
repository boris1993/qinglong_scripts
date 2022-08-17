#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# [task_local]
# Dler Cloud签到
# 0 */2 * * * Dler Cloud签到, tag=Dler Cloud签到, enabled=true

import os
import sys

import requests

sys.tracebacklimit = 0
BASE_URL = "https://dler.cloud/api"
API_VERSION = "v1"
NOTIFICATION_MESSAGE_TITLE = "DlerCloud签到结果："
ENVIRONMENT_VARIABLE_USERNAME = "dler_cloud_email"
ENVIRONMENT_VARIABLE_PASSWORD = "dler_cloud_password"


def main():
    if ENVIRONMENT_VARIABLE_USERNAME not in os.environ or ENVIRONMENT_VARIABLE_PASSWORD not in os.environ:
        raise Exception("环境变量" + ENVIRONMENT_VARIABLE_USERNAME + "或" + ENVIRONMENT_VARIABLE_PASSWORD + "未设置")

    username = os.environ[ENVIRONMENT_VARIABLE_USERNAME]
    password = os.environ[ENVIRONMENT_VARIABLE_PASSWORD]
    access_token = login(username, password)
    checkin(access_token)
    return


def login(email: str, password: str) -> str:
    url = BASE_URL + "/" + API_VERSION + "/login"
    params = {
        "email": email,
        "passwd": password
    }

    print("正在登陆账号", email)

    response = requests.post(url, data=params)
    response.raise_for_status()

    response_body = response.json()
    return response_body["data"]["token"]


def checkin(access_token: str) -> str:
    url = BASE_URL + "/" + API_VERSION + "/checkin"
    params = {
        "access_token": access_token
    }
    response = requests.post(url, data=params)
    response.raise_for_status()

    response_body = response.json()

    if response_body["ret"] == 520:
        result_message = response_body["msg"]
    else:
        result_message = response_body["data"]["checkin"]

    print("签到结果：", result_message)

    return result_message


if __name__ == '__main__':
    main()

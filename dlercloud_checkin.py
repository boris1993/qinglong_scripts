#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# [task_local]
# Dler Cloud签到
# */5 * * * * dlercloud_checkin.py, tag=Dler Cloud签到, enabled=true

import os
import sys

import requests

sys.tracebacklimit = 0
BASE_URL = "https://oixcloud.com/api"
API_VERSION = "v1"
NOTIFICATION_MESSAGE_TITLE = "DlerCloud签到结果："
ENVIRONMENT_VARIABLE_TOKEN = "OIX_CLOUD_TOKEN"

def main():
    if ENVIRONMENT_VARIABLE_TOKEN not in os.environ :
        raise Exception("环境变量" + ENVIRONMENT_VARIABLE_TOKEN + "未设置")

    access_token = os.environ[ENVIRONMENT_VARIABLE_TOKEN]
    checkin(access_token)
    return


def checkin(access_token: str) -> str:
    url = BASE_URL + "/" + API_VERSION + "/checkin"
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    response = requests.post(url, headers=headers)
    response.raise_for_status()

    response_body = response.json()

    return_code = response_body["ret"]

    if return_code == "200":
        result_message = response_body["data"]["checkin"]
    else:
        result_message = response_body["msg"]

    print("签到结果：", result_message)

    return result_message


if __name__ == '__main__':
    main()

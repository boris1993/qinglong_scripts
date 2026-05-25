#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# [task_local]
# 蟹黄堡签到
# 0 10 * * * crabpt_checkin.py.py, tag=蟹黄堡签到, enabled=true

import os
import sys
import requests

sys.tracebacklimit = 0
URL = "https://crabpt.vip/attendance.php"
ENVIRONMENT_VARIABLE_COOKIE = "CRABPT_COOKIE"


def main():
    if ENVIRONMENT_VARIABLE_COOKIE not in os.environ:
        raise Exception("环境变量" + ENVIRONMENT_VARIABLE_COOKIE + "未设置")

    response = requests.get(URL, headers={
      'cookie': os.environ[ENVIRONMENT_VARIABLE_COOKIE]
    })
    response.raise_for_status()
  
    return


if __name__ == '__main__':
    main()

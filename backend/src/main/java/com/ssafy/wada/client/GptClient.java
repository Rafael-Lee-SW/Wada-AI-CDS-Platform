package com.ssafy.wada.client;

import com.ssafy.wada.application.domain.GptRecommend;

public interface GptClient {

	GptRecommend mlModelAndColumnRecommend();
}

package com.ssafy.wada.common.config;

import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableFeignClients(basePackages = "com.ssafy.wada.client")
public class OpenFeignConfig {
}

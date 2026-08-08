package com.intellops.inventory.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.core.convert.MongoCustomConversions;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;

@Configuration
public class MongoConfig {

    @Bean
    public MongoCustomConversions mongoCustomConversions() {
        return new MongoCustomConversions(Arrays.asList(
                // String -> LocalDateTime
                new org.springframework.core.convert.converter.Converter<String, LocalDateTime>() {
                    @Override
                    public LocalDateTime convert(String source) {
                        return LocalDateTime.parse(source, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
                    }
                },
                // LocalDateTime -> String
                new org.springframework.core.convert.converter.Converter<LocalDateTime, String>() {
                    @Override
                    public String convert(LocalDateTime source) {
                        return source.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
                    }
                },
                // String -> LocalDate
                new org.springframework.core.convert.converter.Converter<String, LocalDate>() {
                    @Override
                    public LocalDate convert(String source) {
                        return LocalDate.parse(source);
                    }
                },
                // LocalDate -> String
                new org.springframework.core.convert.converter.Converter<LocalDate, String>() {
                    @Override
                    public String convert(LocalDate source) {
                        return source.toString();
                    }
                },
                // String -> BigDecimal
                new org.springframework.core.convert.converter.Converter<String, BigDecimal>() {
                    @Override
                    public BigDecimal convert(String source) {
                        return new BigDecimal(source);
                    }
                },
                // BigDecimal -> String
                new org.springframework.core.convert.converter.Converter<BigDecimal, String>() {
                    @Override
                    public String convert(BigDecimal source) {
                        return source.toPlainString();
                    }
                }
        ));
    }
}

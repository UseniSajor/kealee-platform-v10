FROM curlimages/curl:8.12.1
COPY run.sh /run.sh
USER root
RUN chmod +x /run.sh
USER curl_user
ENTRYPOINT ["/run.sh"]

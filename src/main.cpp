#include <iostream>
#include <string>
#include <fstream>
#include <boost/asio.hpp>
#include <boost/beast.hpp>

namespace asio = boost::asio;
namespace beast = boost::beast;
using tcp = asio::ip::tcp;

std::string readStaticFile(const std::string& path) {
    std::ifstream file(path);
    if (!file.is_open()) {
        return "";  // Return an empty string if the file doesn't exist
    }
    return std::string((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());
}

int main() {
    try {
        // Create an IO context
        asio::io_context io_context;

        // Create an endpoint to listen on (port 8080)
        tcp::endpoint endpoint{tcp::v4(), 8080};

        // Create and bind the acceptor
        tcp::acceptor acceptor(io_context, endpoint);

        while (true) {
            // Wait for a client to connect
            tcp::socket socket(io_context);
            acceptor.accept(socket);

            // Read the HTTP request from the client
            beast::flat_buffer buffer;
            beast::http::request<beast::http::string_body> request;
            beast::http::read(socket, buffer, request);

            // Serve static files based on the requested URL
            std::string url = std::string(request.target());
            if (url == "/" || url == "/index.html") {
                std::string content = readStaticFile("static/html/index.html");
                if (!content.empty()) {
                    // Create and send an HTTP response
                    beast::http::response<beast::http::string_body> response(beast::http::status::ok, request.version());
                    response.set(beast::http::field::server, "SimpleCppServer");
                    response.set(beast::http::field::content_type, "text/html");
                    response.body() = content;
                    response.prepare_payload();
                    beast::http::write(socket, response);
                }
            } else if (url == "/static/css/styles.css") {
                std::string content = readStaticFile("static/css/styles.css");
                if (!content.empty()) {
                    // Create and send an HTTP response for CSS
                    beast::http::response<beast::http::string_body> response(beast::http::status::ok, request.version());
                    response.set(beast::http::field::server, "SimpleCppServer");
                    response.set(beast::http::field::content_type, "text/css");
                    response.body() = content;
                    response.prepare_payload();
                    beast::http::write(socket, response);
                }
            } else if (url == "/static/js/script.js") {
                std::string content = readStaticFile("static/js/script.js");
                if (!content.empty()) {
                    // Create and send an HTTP response for JavaScript
                    beast::http::response<beast::http::string_body> response(beast::http::status::ok, request.version());
                    response.set(beast::http::field::server, "SimpleCppServer");
                    response.set(beast::http::field::content_type, "application/javascript");
                    response.body() = content;
                    response.prepare_payload();
                    beast::http::write(socket, response);
                }
            } else {
                // Handle 404 Not Found for other routes
                beast::http::response<beast::http::string_body> response(beast::http::status::not_found, request.version());
                response.set(beast::http::field::server, "SimpleCppServer");
                response.set(beast::http::field::content_type, "text/plain");
                response.body() = "404 Not Found";
                response.prepare_payload();
                beast::http::write(socket, response);
            }
        }
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
    }

    return 0;
}

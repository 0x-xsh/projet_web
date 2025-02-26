import consul
import socket
import os
import logging
from django.conf import settings
import requests

logger = logging.getLogger(__name__)

class ServiceRegistry:
    def __init__(self):
        self.consul_host = os.environ.get('CONSUL_HOST', 'localhost')
        self.consul_port = int(os.environ.get('CONSUL_PORT', 8500))
        self.service_name = os.environ.get('SERVICE_NAME', 'unknown-service')
        self.service_port = int(os.environ.get('PORT', 9000))
        
        # Create Consul client
        self.consul = consul.Consul(host=self.consul_host, port=self.consul_port)
        
        # Get container hostname for service ID
        self.service_id = f"{self.service_name}-{socket.gethostname()}"
        
        # Get the container's IP
        self.service_ip = self._get_service_ip()
        
    def _get_service_ip(self):
        """Get the service IP address."""
        try:
            # First try to get the container's IP address using hostname resolution
            return socket.gethostbyname(socket.gethostname())
        except:
            # Fallback to getting local IP
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            try:
                # doesn't have to be reachable
                s.connect(('10.255.255.255', 1))
                ip = s.getsockname()[0]
            except:
                ip = '127.0.0.1'
            finally:
                s.close()
            return ip
    
    def register(self):
        """Register the service with Consul."""
        try:
            check = {
                "http": f"http://{self.service_ip}:{self.service_port}/health/",
                "interval": "10s",
                "timeout": "5s"
            }
            
            self.consul.agent.service.register(
                name=self.service_name,
                service_id=self.service_id,
                address=self.service_ip,
                port=self.service_port,
                check=check
            )
            logger.info(f"Service {self.service_name} registered with Consul")
            return True
        except Exception as e:
            logger.error(f"Failed to register with Consul: {str(e)}")
            return False
    
    def deregister(self):
        """Deregister the service from Consul."""
        try:
            self.consul.agent.service.deregister(self.service_id)
            logger.info(f"Service {self.service_name} deregistered from Consul")
            return True
        except Exception as e:
            logger.error(f"Failed to deregister from Consul: {str(e)}")
            return False
    
    def discover_service(self, service_name):
        """Discover a service by name and return one of its instances."""
        try:
            services = self.consul.catalog.service(service_name)[1]
            if services:
                service = services[0]
                return {
                    'id': service['ServiceID'],
                    'name': service['ServiceName'],
                    'address': service['ServiceAddress'] or service['Address'],
                    'port': service['ServicePort'],
                    'url': f"http://{service['ServiceAddress'] or service['Address']}:{service['ServicePort']}"
                }
            return None
        except Exception as e:
            logger.error(f"Failed to discover service {service_name}: {str(e)}")
            return None
    
    def discover_service_url(self, service_name):
        """Convenience method to get the URL for a service."""
        service = self.discover_service(service_name)
        if service:
            return service['url']
        return None
    
    def request_service(self, service_name, path, method='GET', **kwargs):
        """Make a request to a service using service discovery."""
        service_url = self.discover_service_url(service_name)
        if not service_url:
            logger.error(f"Could not discover service: {service_name}")
            return None
        
        url = f"{service_url}{path}"
        try:
            response = requests.request(method, url, **kwargs)
            return response
        except Exception as e:
            logger.error(f"Error making request to {service_name} at {url}: {str(e)}")
            return None

# Singleton instance
service_registry = ServiceRegistry() 
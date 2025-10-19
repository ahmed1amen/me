---
layout: post
title: "Laravel Service Container & Dependency Injection: The Complete Guide"
date: 2024-09-19 14:30:00 +0200
categories: [Engineering, Backend]
tags: [laravel, php, dependency-injection, service-container, architecture, design-patterns]
author: Ahmed Amen
excerpt: "Master Laravel's service container, dependency injection, automatic binding, and service providers—the foundation that makes Laravel's magic possible."
---

Laravel's service container is the beating heart of the framework. **It's the most important concept to master if you want to understand how Laravel works under the hood**—and how to write better, more maintainable code.

Here's everything you need to know about dependency injection, automatic binding, and service providers, explained with practical examples that anyone can understand.

![Laravel Service Container Flow](/assets/laravel-container-flow.svg)

## What is a Service Container?

Think of Laravel's service container as a **smart factory and warehouse combined**. It knows how to build objects, stores them when needed, and delivers them exactly when and where they're required.

```text
Traditional Object Creation:
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Class A   │───▶│   Class B   │───▶│   Class C   │
│ new B($c)   │    │ new C($db)  │    │ new DB()    │
└─────────────┘    └─────────────┘    └─────────────┘
     ▲
     │ Manual dependency management
     │ Hard to test, hard to maintain

Service Container Approach:
┌─────────────┐    ┌─────────────────────────────────┐
│   Class A   │───▶│        Service Container        │
│ needs B     │    │  ┌─────────┐  ┌─────────────┐   │
└─────────────┘    │  │ Class B │  │   Class C   │   │
     ▲             │  │ Recipe  │  │   Recipe    │   │
     │             │  └─────────┘  └─────────────┘   │
     │ Container   │           ▲                     │
     │ handles     │           │ Auto-resolves       │
     │ everything  │           │ dependencies        │
                   └─────────────────────────────────┘
```

**Without Service Container:**
```php
// Manual dependency management - painful!
class OrderController
{
    public function store(Request $request)
    {
        $database = new PDO('mysql:host=localhost', 'user', 'pass');
        $userRepo = new UserRepository($database);
        $emailService = new EmailService(new SmtpConfig());
        $paymentGateway = new StripeGateway(config('stripe.key'));
        
        $orderService = new OrderService(
            $userRepo, 
            $emailService, 
            $paymentGateway
        );
        
        return $orderService->createOrder($request->all());
    }
}
```

**With Service Container:**
```php
// Laravel's magic - clean and testable!
class OrderController
{
    public function store(Request $request, OrderService $orderService)
    {
        return $orderService->createOrder($request->all());
    }
}
```

The container automatically figures out that `OrderService` needs a `UserRepository`, `EmailService`, and `PaymentGateway`, creates them all, and injects them for you.

## Understanding Dependency Injection & IoC

Dependency Injection (DI) is a design pattern that implements **Inversion of Control (IoC)**—a principle where objects receive their dependencies from external sources rather than creating them internally.

### What is Inversion of Control?

IoC **inverts** (flips) the traditional control flow. Instead of your objects controlling how their dependencies are created, an external container takes control of that responsibility.

```text
Traditional Control Flow:
┌─────────────────────────────────────────────────────────┐
│  Object A creates and controls Object B                │
│  ┌─────────────┐    ┌─────────────┐                    │
│  │   Class A   │───▶│   Class B   │                    │
│  │ "I create   │    │ "I am       │                    │
│  │  my deps"   │    │  created"   │                    │
│  └─────────────┘    └─────────────┘                    │
│         ▲                                              │
│         │ Object A is in control                       │
└─────────────────────────────────────────────────────────┘

Inverted Control Flow (IoC):
┌─────────────────────────────────────────────────────────┐
│  External Container controls object creation            │
│  ┌─────────────┐    ┌─────────────────────────────────┐ │
│  │   Class A   │◀───│     IoC Container              │ │
│  │ "Give me    │    │ "I create everything           │ │
│  │  what I     │    │  and inject it"                │ │
│  │  need"      │    │                                │ │
│  └─────────────┘    │  ┌─────────────┐               │ │
│                     │  │   Class B   │               │ │
│                     │  │ "I am       │               │ │
│                     │  │  injected"  │               │ │
│                     │  └─────────────┘               │ │
│                     └─────────────────────────────────┘ │
│              ▲                                          │
│              │ Container is in control                  │
└─────────────────────────────────────────────────────────┘
```

**Laravel's service container is an IoC container**—it inverts control by managing object creation and dependency resolution for you.

### The Problem DI Solves

```php
// BAD: Hard dependencies - difficult to test and maintain
class OrderService
{
    private $emailService;
    private $paymentGateway;
    
    public function __construct()
    {
        // Tightly coupled to specific implementations
        $this->emailService = new SmtpEmailService();
        $this->paymentGateway = new StripeGateway();
    }
    
    public function createOrder($data)
    {
        // What if you want to test this?
        // What if you want to use a different email service?
        // You're stuck with SMTP and Stripe!
    }
}
```

### The DI Solution

```php
// GOOD: Dependencies injected - flexible and testable
class OrderService
{
    private $emailService;
    private $paymentGateway;
    
    public function __construct(
        EmailServiceInterface $emailService,
        PaymentGatewayInterface $paymentGateway
    ) {
        $this->emailService = $emailService;
        $this->paymentGateway = $paymentGateway;
    }
    
    public function createOrder($data)
    {
        // Now you can inject ANY email service or payment gateway
        // Testing becomes easy with mock objects
        // Switching implementations is painless
    }
}
```

### Types of Dependency Injection in Laravel

#### 1. Constructor Injection (Most Common)

```php
class UserController extends Controller
{
    private $userRepository;
    private $emailService;
    
    public function __construct(
        UserRepository $userRepository,
        EmailService $emailService
    ) {
        $this->userRepository = $userRepository;
        $this->emailService = $emailService;
    }
    
    public function store(Request $request)
    {
        $user = $this->userRepository->create($request->validated());
        $this->emailService->sendWelcomeEmail($user);
        
        return response()->json($user, 201);
    }
}
```

#### 2. Method Injection

```php
class UserController extends Controller
{
    // Dependencies injected directly into methods
    public function show(User $user, UserTransformer $transformer)
    {
        return $transformer->transform($user);
    }
    
    public function update(
        Request $request, 
        User $user, 
        UserRepository $repository
    ) {
        $updated = $repository->update($user, $request->validated());
        return response()->json($updated);
    }
}
```

#### 3. Property Injection (Less Common)

```php
class BaseController extends Controller
{
    // Laravel can inject into public properties
    public $logger;
    
    public function __construct(LoggerInterface $logger)
    {
        $this->logger = $logger;
    }
}
```

## How Automatic Binding Works

Laravel's container uses **reflection** to automatically figure out dependencies. Here's what happens behind the scenes:

```text
Container Resolution Process:
┌─────────────────────────────────────────────────────────────┐
│ 1. Request for OrderService                                 │
│    ↓                                                        │
│ 2. Container reflects on OrderService::__construct()       │
│    ↓                                                        │
│ 3. Finds dependencies: UserRepo, EmailService, Gateway     │
│    ↓                                                        │
│ 4. Recursively resolves each dependency                    │
│    ↓                                                        │
│ 5. Creates OrderService with all dependencies injected     │
│    ↓                                                        │
│ 6. Returns fully constructed object                        │
└─────────────────────────────────────────────────────────────┘
```

### Automatic Resolution Example

```php
// 1. Define your classes with type-hinted dependencies
class UserRepository
{
    private $database;
    
    public function __construct(DatabaseManager $database)
    {
        $this->database = $database;
    }
}

class EmailService
{
    private $mailer;
    
    public function __construct(MailerInterface $mailer)
    {
        $this->mailer = $mailer;
    }
}

class OrderService
{
    private $userRepo;
    private $emailService;
    
    public function __construct(
        UserRepository $userRepo,
        EmailService $emailService
    ) {
        $this->userRepo = $userRepo;
        $this->emailService = $emailService;
    }
}

// 2. Laravel automatically resolves the entire chain!
$orderService = app(OrderService::class);
// Container automatically creates:
// - DatabaseManager
// - UserRepository (with DatabaseManager injected)
// - MailerInterface implementation
// - EmailService (with Mailer injected)
// - OrderService (with UserRepository and EmailService injected)
```

### Manual Container Interaction

```php
// Get instance from container
$orderService = app(OrderService::class);
$orderService = resolve(OrderService::class);
$orderService = app()->make(OrderService::class);

// Check if bound
if (app()->bound(OrderService::class)) {
    $service = app(OrderService::class);
}

// Resolve with parameters
$service = app()->makeWith(OrderService::class, [
    'customParam' => 'value'
]);
```

## Binding Types and Patterns

### 1. Simple Binding

```php
// In a service provider or AppServiceProvider
public function register()
{
    // Bind a concrete class
    $this->app->bind(EmailService::class, SmtpEmailService::class);
    
    // Bind with a closure
    $this->app->bind(PaymentGateway::class, function ($app) {
        return new StripeGateway(
            config('services.stripe.key'),
            config('services.stripe.secret')
        );
    });
}
```

### 2. Singleton Binding

```php
public function register()
{
    // Single instance shared across the application
    $this->app->singleton(CacheManager::class, function ($app) {
        return new RedisCache(
            $app->make('redis'),
            config('cache.prefix')
        );
    });
    
    // Shorthand for singleton
    $this->app->singleton(LoggerInterface::class, FileLogger::class);
}
```

### 3. Interface Binding

```php
// Define your interface
interface PaymentGatewayInterface
{
    public function charge($amount, $token);
    public function refund($transactionId, $amount);
}

// Implementation
class StripeGateway implements PaymentGatewayInterface
{
    public function charge($amount, $token)
    {
        // Stripe-specific implementation
    }
    
    public function refund($transactionId, $amount)
    {
        // Stripe-specific refund logic
    }
}

// Bind interface to implementation
public function register()
{
    $this->app->bind(
        PaymentGatewayInterface::class, 
        StripeGateway::class
    );
}

// Now you can inject the interface anywhere
class OrderService
{
    public function __construct(PaymentGatewayInterface $gateway)
    {
        // Will receive StripeGateway instance
        $this->gateway = $gateway;
    }
}
```

### 4. Contextual Binding

```php
public function register()
{
    // Different implementations based on context
    $this->app->when(OrderService::class)
        ->needs(PaymentGatewayInterface::class)
        ->give(StripeGateway::class);
        
    $this->app->when(SubscriptionService::class)
        ->needs(PaymentGatewayInterface::class)
        ->give(PayPalGateway::class);
        
    // Contextual binding with closure
    $this->app->when(ReportService::class)
        ->needs(DatabaseConnection::class)
        ->give(function () {
            return new DatabaseConnection('reports_db');
        });
}
```

### 5. Tagged Binding

```php
public function register()
{
    // Tag multiple services
    $this->app->bind(EmailLogger::class);
    $this->app->bind(FileLogger::class);
    $this->app->bind(DatabaseLogger::class);
    
    $this->app->tag([
        EmailLogger::class,
        FileLogger::class,
        DatabaseLogger::class,
    ], 'loggers');
}

// Resolve all tagged services
public function boot()
{
    $loggers = $this->app->tagged('loggers');
    
    foreach ($loggers as $logger) {
        // Do something with each logger
    }
}
```

### 6. Instance Binding

```php
public function register()
{
    // Bind an existing instance
    $apiClient = new ApiClient('https://api.example.com', [
        'timeout' => 30,
        'headers' => ['User-Agent' => 'MyApp/1.0']
    ]);
    
    $this->app->instance(ApiClient::class, $apiClient);
}
```

## Service Providers: The Registration Hub

Service providers are the **central place** where you configure how your application's services are bound and booted.

### Anatomy of a Service Provider

```php
<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class PaymentServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     * 
     * This runs early - only bind things to the container here.
     * Don't try to resolve anything yet!
     */
    public function register()
    {
        // Simple binding
        $this->app->bind(
            PaymentGatewayInterface::class,
            StripeGateway::class
        );
        
        // Singleton with configuration
        $this->app->singleton(PaymentProcessor::class, function ($app) {
            return new PaymentProcessor(
                $app->make(PaymentGatewayInterface::class),
                config('payment.currency'),
                config('payment.tax_rate')
            );
        });
        
        // Merge configuration
        $this->mergeConfigFrom(
            __DIR__.'/../config/payment.php',
            'payment'
        );
    }
    
    /**
     * Bootstrap any application services.
     * 
     * This runs later - safe to resolve services here.
     */
    public function boot()
    {
        // Publish configuration
        $this->publishes([
            __DIR__.'/../config/payment.php' => config_path('payment.php'),
        ], 'payment-config');
        
        // Register event listeners
        $this->app['events']->listen(
            PaymentProcessed::class,
            PaymentProcessedListener::class
        );
        
        // Extend existing services
        $this->app->extend(LogManager::class, function ($manager, $app) {
            $manager->extend('payment', function () {
                return new PaymentLogger();
            });
            
            return $manager;
        });
    }
    
    /**
     * Get the services provided by the provider.
     */
    public function provides()
    {
        return [
            PaymentGatewayInterface::class,
            PaymentProcessor::class,
        ];
    }
}
```

### Built-in Service Providers

Laravel comes with many service providers that handle core functionality:

```php
// config/app.php
'providers' => [
    // Laravel Framework Service Providers
    Illuminate\Auth\AuthServiceProvider::class,
    Illuminate\Broadcasting\BroadcastServiceProvider::class,
    Illuminate\Bus\BusServiceProvider::class,
    Illuminate\Cache\CacheServiceProvider::class,
    Illuminate\Foundation\Providers\ConsoleSupportServiceProvider::class,
    Illuminate\Cookie\CookieServiceProvider::class,
    Illuminate\Database\DatabaseServiceProvider::class,
    Illuminate\Encryption\EncryptionServiceProvider::class,
    Illuminate\Filesystem\FilesystemServiceProvider::class,
    Illuminate\Foundation\Providers\FoundationServiceProvider::class,
    Illuminate\Hashing\HashServiceProvider::class,
    Illuminate\Mail\MailServiceProvider::class,
    Illuminate\Notifications\NotificationServiceProvider::class,
    Illuminate\Pagination\PaginationServiceProvider::class,
    Illuminate\Pipeline\PipelineServiceProvider::class,
    Illuminate\Queue\QueueServiceProvider::class,
    Illuminate\Redis\RedisServiceProvider::class,
    Illuminate\Auth\Passwords\PasswordResetServiceProvider::class,
    Illuminate\Session\SessionServiceProvider::class,
    Illuminate\Translation\TranslationServiceProvider::class,
    Illuminate\Validation\ValidationServiceProvider::class,
    Illuminate\View\ViewServiceProvider::class,

    // Application Service Providers
    App\Providers\AppServiceProvider::class,
    App\Providers\AuthServiceProvider::class,
    App\Providers\EventServiceProvider::class,
    App\Providers\RouteServiceProvider::class,
],
```

### Creating Custom Service Providers

```bash
# Generate a new service provider
php artisan make:provider PaymentServiceProvider
```

```php
<?php

namespace App\Providers;

use App\Services\PaymentGateway\StripeGateway;
use App\Services\PaymentGateway\PayPalGateway;
use App\Services\PaymentGateway\PaymentGatewayInterface;
use App\Services\NotificationService;
use App\Services\AuditLogger;
use Illuminate\Support\ServiceProvider;
use Illuminate\Contracts\Foundation\Application;

class PaymentServiceProvider extends ServiceProvider
{
    /**
     * Indicates if loading of the provider is deferred.
     */
    protected $defer = false;
    
    public function register()
    {
        // Bind payment gateway based on configuration
        $this->app->bind(PaymentGatewayInterface::class, function (Application $app) {
            $gateway = config('payment.default_gateway');
            
            switch ($gateway) {
                case 'stripe':
                    return new StripeGateway(
                        config('payment.stripe.key'),
                        config('payment.stripe.secret')
                    );
                    
                case 'paypal':
                    return new PayPalGateway(
                        config('payment.paypal.client_id'),
                        config('payment.paypal.client_secret'),
                        config('payment.paypal.mode')
                    );
                    
                default:
                    throw new \InvalidArgumentException("Unknown payment gateway: {$gateway}");
            }
        });
        
        // Register audit logger as singleton
        $this->app->singleton(AuditLogger::class, function (Application $app) {
            return new AuditLogger(
                $app->make('log'),
                config('audit.enabled'),
                config('audit.channels', ['database', 'file'])
            );
        });
        
        // Register notification service with multiple channels
        $this->app->singleton(NotificationService::class, function (Application $app) {
            $service = new NotificationService();
            
            // Add email channel
            $service->addChannel('email', $app->make('mailer'));
            
            // Add SMS channel if configured
            if (config('notification.sms.enabled')) {
                $service->addChannel('sms', $app->make('sms'));
            }
            
            // Add push notification channel
            if (config('notification.push.enabled')) {
                $service->addChannel('push', $app->make('push'));
            }
            
            return $service;
        });
    }
    
    public function boot()
    {
        // Publish configuration files
        $this->publishes([
            __DIR__.'/../config/payment.php' => config_path('payment.php'),
        ], 'payment-config');
        
        // Load custom configurations
        $this->mergeConfigFrom(
            __DIR__.'/../config/payment.php',
            'payment'
        );
        
        // Register custom validation rules
        $this->app['validator']->extend('credit_card', function ($attribute, $value, $parameters, $validator) {
            return $this->app[PaymentGatewayInterface::class]->validateCard($value);
        });
        
        // Register macros
        $this->registerMacros();
        
        // Set up event listeners
        $this->registerEventListeners();
    }
    
    private function registerMacros()
    {
        // Add a macro to the Response class
        \Illuminate\Http\Response::macro('paymentSuccess', function ($transaction) {
            return $this->json([
                'success' => true,
                'transaction_id' => $transaction->id,
                'amount' => $transaction->amount,
                'currency' => $transaction->currency,
                'message' => 'Payment processed successfully',
            ]);
        });
    }
    
    private function registerEventListeners()
    {
        $this->app['events']->listen(
            \App\Events\PaymentProcessed::class,
            \App\Listeners\SendPaymentNotification::class
        );
        
        $this->app['events']->listen(
            \App\Events\PaymentFailed::class,
            \App\Listeners\LogPaymentFailure::class
        );
    }
}
```

### Deferred Service Providers

```php
<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class ExpensiveServiceProvider extends ServiceProvider
{
    /**
     * Indicates if loading of the provider is deferred.
     */
    protected $defer = true;
    
    public function register()
    {
        $this->app->singleton(ExpensiveService::class, function ($app) {
            // This only runs when ExpensiveService is actually needed
            return new ExpensiveService(
                $app->make('heavy.dependency'),
                $app->make('another.heavy.service')
            );
        });
    }
    
    /**
     * Get the services provided by the provider.
     */
    public function provides()
    {
        return [ExpensiveService::class];
    }
}
```

## Real-World Examples

### Example 1: Building a Notification System

```php
// 1. Define the interface
interface NotificationChannelInterface
{
    public function send($recipient, $message);
}

// 2. Implement different channels
class EmailChannel implements NotificationChannelInterface
{
    private $mailer;
    
    public function __construct(MailerInterface $mailer)
    {
        $this->mailer = $mailer;
    }
    
    public function send($recipient, $message)
    {
        $this->mailer->send($recipient, $message);
    }
}

class SmsChannel implements NotificationChannelInterface
{
    private $smsService;
    
    public function __construct(SmsServiceInterface $smsService)
    {
        $this->smsService = $smsService;
    }
    
    public function send($recipient, $message)
    {
        $this->smsService->sendSms($recipient, $message);
    }
}

// 3. Main notification service
class NotificationService
{
    private $channels = [];
    
    public function addChannel($name, NotificationChannelInterface $channel)
    {
        $this->channels[$name] = $channel;
    }
    
    public function send($channel, $recipient, $message)
    {
        if (!isset($this->channels[$channel])) {
            throw new \InvalidArgumentException("Channel {$channel} not found");
        }
        
        $this->channels[$channel]->send($recipient, $message);
    }
}

// 4. Service provider configuration
class NotificationServiceProvider extends ServiceProvider
{
    public function register()
    {
        // Bind individual channels
        $this->app->bind(EmailChannel::class);
        $this->app->bind(SmsChannel::class);
        
        // Bind and configure the main service
        $this->app->singleton(NotificationService::class, function ($app) {
            $service = new NotificationService();
            
            $service->addChannel('email', $app->make(EmailChannel::class));
            $service->addChannel('sms', $app->make(SmsChannel::class));
            
            return $service;
        });
    }
}

// 5. Usage in controller
class UserController extends Controller
{
    public function sendWelcome(Request $request, NotificationService $notifications)
    {
        $user = User::find($request->user_id);
        
        // Send welcome email
        $notifications->send('email', $user->email, 'Welcome to our platform!');
        
        // Send SMS if user has phone
        if ($user->phone) {
            $notifications->send('sms', $user->phone, 'Welcome! Your account is ready.');
        }
        
        return response()->json(['message' => 'Welcome notifications sent']);
    }
}
```

### Example 2: Multi-Tenant Application

```php
// 1. Tenant-aware database connection
class TenantDatabaseManager
{
    private $connections = [];
    private $currentTenant;
    
    public function setTenant($tenantId)
    {
        $this->currentTenant = $tenantId;
    }
    
    public function getConnection()
    {
        if (!$this->currentTenant) {
            throw new \Exception('No tenant set');
        }
        
        if (!isset($this->connections[$this->currentTenant])) {
            $config = config("database.tenants.{$this->currentTenant}");
            $this->connections[$this->currentTenant] = new DatabaseConnection($config);
        }
        
        return $this->connections[$this->currentTenant];
    }
}

// 2. Tenant-aware service
class TenantUserService
{
    private $dbManager;
    
    public function __construct(TenantDatabaseManager $dbManager)
    {
        $this->dbManager = $dbManager;
    }
    
    public function getUsers()
    {
        $connection = $this->dbManager->getConnection();
        return $connection->table('users')->get();
    }
}

// 3. Service provider
class TenantServiceProvider extends ServiceProvider
{
    public function register()
    {
        $this->app->singleton(TenantDatabaseManager::class);
        
        // Tenant-aware binding
        $this->app->bind(TenantUserService::class, function ($app) {
            return new TenantUserService(
                $app->make(TenantDatabaseManager::class)
            );
        });
    }
    
    public function boot()
    {
        // Middleware to set tenant from request
        $this->app['router']->middleware('tenant', function ($request, $next) {
            $tenantId = $request->header('X-Tenant-ID');
            
            if ($tenantId) {
                app(TenantDatabaseManager::class)->setTenant($tenantId);
            }
            
            return $next($request);
        });
    }
}
```

### Example 3: Feature Flag System

```php
// 1. Feature flag interface
interface FeatureFlagInterface
{
    public function isEnabled($flag, $userId = null);
    public function getAllFlags($userId = null);
}

// 2. Database implementation
class DatabaseFeatureFlag implements FeatureFlagInterface
{
    private $db;
    private $cache;
    
    public function __construct(DatabaseManager $db, CacheManager $cache)
    {
        $this->db = $db;
        $this->cache = $cache;
    }
    
    public function isEnabled($flag, $userId = null)
    {
        $cacheKey = "feature_flag:{$flag}:" . ($userId ?? 'global');
        
        return $this->cache->remember($cacheKey, 300, function () use ($flag, $userId) {
            $query = $this->db->table('feature_flags')
                ->where('name', $flag)
                ->where('active', true);
                
            if ($userId) {
                $query->where(function ($q) use ($userId) {
                    $q->whereNull('user_id')
                      ->orWhere('user_id', $userId);
                });
            } else {
                $query->whereNull('user_id');
            }
            
            return $query->exists();
        });
    }
    
    public function getAllFlags($userId = null)
    {
        // Implementation for getting all flags
    }
}

// 3. Configuration implementation
class ConfigFeatureFlag implements FeatureFlagInterface
{
    public function isEnabled($flag, $userId = null)
    {
        return config("features.{$flag}", false);
    }
    
    public function getAllFlags($userId = null)
    {
        return config('features', []);
    }
}

// 4. Service provider
class FeatureFlagServiceProvider extends ServiceProvider
{
    public function register()
    {
        $this->app->bind(FeatureFlagInterface::class, function ($app) {
            $driver = config('features.driver', 'config');
            
            switch ($driver) {
                case 'database':
                    return new DatabaseFeatureFlag(
                        $app->make('db'),
                        $app->make('cache')
                    );
                    
                case 'config':
                default:
                    return new ConfigFeatureFlag();
            }
        });
    }
    
    public function boot()
    {
        // Add blade directive
        \Blade::directive('feature', function ($expression) {
            return "<?php if(app(\\App\\Contracts\\FeatureFlagInterface::class)->isEnabled({$expression})): ?>";
        });
        
        \Blade::directive('endfeature', function () {
            return "<?php endif; ?>";
        });
    }
}

// 5. Usage examples
class ProductController extends Controller
{
    public function index(FeatureFlagInterface $features)
    {
        $products = Product::all();
        
        if ($features->isEnabled('new_search', auth()->id())) {
            // Use new search implementation
            $products = $this->newSearchService->search($products);
        }
        
        return view('products.index', compact('products'));
    }
}

// In Blade templates:
// @feature('new_ui')
//     <div class="new-ui-component">...</div>
// @endfeature
```

## Advanced Container Patterns

### 1. Factory Pattern with Container

```php
interface ReportGeneratorInterface
{
    public function generate($data);
}

class PdfReportGenerator implements ReportGeneratorInterface
{
    public function generate($data)
    {
        // PDF generation logic
    }
}

class ExcelReportGenerator implements ReportGeneratorInterface
{
    public function generate($data)
    {
        // Excel generation logic
    }
}

class ReportGeneratorFactory
{
    private $container;
    
    public function __construct(Container $container)
    {
        $this->container = $container;
    }
    
    public function create($type)
    {
        switch ($type) {
            case 'pdf':
                return $this->container->make(PdfReportGenerator::class);
            case 'excel':
                return $this->container->make(ExcelReportGenerator::class);
            default:
                throw new \InvalidArgumentException("Unknown report type: {$type}");
        }
    }
}

// Service provider
public function register()
{
    $this->app->bind(ReportGeneratorFactory::class);
    $this->app->bind(PdfReportGenerator::class);
    $this->app->bind(ExcelReportGenerator::class);
}
```

### 2. Decorator Pattern with Container

```php
interface CacheInterface
{
    public function get($key);
    public function set($key, $value, $ttl = null);
}

class RedisCache implements CacheInterface
{
    private $redis;
    
    public function __construct(Redis $redis)
    {
        $this->redis = $redis;
    }
    
    public function get($key)
    {
        return $this->redis->get($key);
    }
    
    public function set($key, $value, $ttl = null)
    {
        return $this->redis->set($key, $value, $ttl);
    }
}

class LoggingCacheDecorator implements CacheInterface
{
    private $cache;
    private $logger;
    
    public function __construct(CacheInterface $cache, LoggerInterface $logger)
    {
        $this->cache = $cache;
        $this->logger = $logger;
    }
    
    public function get($key)
    {
        $this->logger->info("Cache get: {$key}");
        return $this->cache->get($key);
    }
    
    public function set($key, $value, $ttl = null)
    {
        $this->logger->info("Cache set: {$key}");
        return $this->cache->set($key, $value, $ttl);
    }
}

// Service provider
public function register()
{
    $this->app->bind(CacheInterface::class, function ($app) {
        $baseCache = new RedisCache($app->make('redis'));
        
        if (config('cache.logging.enabled')) {
            return new LoggingCacheDecorator(
                $baseCache,
                $app->make(LoggerInterface::class)
            );
        }
        
        return $baseCache;
    });
}
```

### 3. Strategy Pattern with Container

```php
interface PaymentStrategyInterface
{
    public function processPayment($amount, $details);
}

class CreditCardStrategy implements PaymentStrategyInterface
{
    public function processPayment($amount, $details)
    {
        // Credit card processing
    }
}

class PayPalStrategy implements PaymentStrategyInterface
{
    public function processPayment($amount, $details)
    {
        // PayPal processing
    }
}

class BankTransferStrategy implements PaymentStrategyInterface
{
    public function processPayment($amount, $details)
    {
        // Bank transfer processing
    }
}

class PaymentContext
{
    private $strategies = [];
    
    public function addStrategy($name, PaymentStrategyInterface $strategy)
    {
        $this->strategies[$name] = $strategy;
    }
    
    public function processPayment($method, $amount, $details)
    {
        if (!isset($this->strategies[$method])) {
            throw new \InvalidArgumentException("Payment method {$method} not supported");
        }
        
        return $this->strategies[$method]->processPayment($amount, $details);
    }
}

// Service provider
public function register()
{
    $this->app->singleton(PaymentContext::class, function ($app) {
        $context = new PaymentContext();
        
        $context->addStrategy('credit_card', $app->make(CreditCardStrategy::class));
        $context->addStrategy('paypal', $app->make(PayPalStrategy::class));
        $context->addStrategy('bank_transfer', $app->make(BankTransferStrategy::class));
        
        return $context;
    });
}
```

## Testing with the Service Container

### 1. Mocking Dependencies

```php
class OrderServiceTest extends TestCase
{
    public function test_creates_order_successfully()
    {
        // Arrange
        $mockPaymentGateway = Mockery::mock(PaymentGatewayInterface::class);
        $mockEmailService = Mockery::mock(EmailServiceInterface::class);
        
        $mockPaymentGateway->shouldReceive('charge')
            ->once()
            ->with(100, 'token_123')
            ->andReturn(['transaction_id' => 'txn_456']);
            
        $mockEmailService->shouldReceive('sendOrderConfirmation')
            ->once()
            ->with(Mockery::type(Order::class));
        
        // Bind mocks to container
        $this->app->instance(PaymentGatewayInterface::class, $mockPaymentGateway);
        $this->app->instance(EmailServiceInterface::class, $mockEmailService);
        
        // Act
        $orderService = $this->app->make(OrderService::class);
        $order = $orderService->createOrder([
            'amount' => 100,
            'payment_token' => 'token_123',
            'user_id' => 1
        ]);
        
        // Assert
        $this->assertInstanceOf(Order::class, $order);
        $this->assertEquals(100, $order->amount);
    }
}
```

### 2. Swapping Implementations in Tests

```php
class FeatureTest extends TestCase
{
    public function test_user_registration_with_test_email_service()
    {
        // Swap email service with test implementation
        $this->app->bind(EmailServiceInterface::class, TestEmailService::class);
        
        $response = $this->post('/register', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'password123'
        ]);
        
        $response->assertStatus(201);
        
        // Verify email was "sent" using test service
        $testEmailService = $this->app->make(EmailServiceInterface::class);
        $this->assertTrue($testEmailService->wasEmailSent('john@example.com'));
    }
}

class TestEmailService implements EmailServiceInterface
{
    private $sentEmails = [];
    
    public function sendWelcomeEmail($recipient)
    {
        $this->sentEmails[] = $recipient;
    }
    
    public function wasEmailSent($recipient)
    {
        return in_array($recipient, $this->sentEmails);
    }
}
```

## Common Pitfalls and Solutions

### 1. Circular Dependencies

```php
// PROBLEM: Circular dependency
class UserService
{
    public function __construct(OrderService $orderService)
    {
        $this->orderService = $orderService;
    }
}

class OrderService
{
    public function __construct(UserService $userService)
    {
        $this->userService = $userService;
    }
}

// SOLUTION 1: Extract shared dependency
class UserRepository
{
    // Shared logic
}

class UserService
{
    public function __construct(UserRepository $userRepository)
    {
        $this->userRepository = $userRepository;
    }
}

class OrderService
{
    public function __construct(UserRepository $userRepository)
    {
        $this->userRepository = $userRepository;
    }
}

// SOLUTION 2: Use events for decoupling
class UserService
{
    public function createUser($data)
    {
        $user = User::create($data);
        
        // Fire event instead of calling OrderService directly
        event(new UserCreated($user));
        
        return $user;
    }
}

class OrderService
{
    // Listen to UserCreated event
    public function handleUserCreated(UserCreated $event)
    {
        // Create welcome order or setup account
    }
}
```

### 2. Over-injection

```php
// PROBLEM: Too many dependencies
class UserController extends Controller
{
    public function __construct(
        UserRepository $userRepo,
        EmailService $emailService,
        PaymentService $paymentService,
        NotificationService $notificationService,
        AuditLogger $auditLogger,
        CacheManager $cache,
        FileUploadService $fileService
    ) {
        // Too many dependencies = code smell
    }
}

// SOLUTION: Use facade or aggregate service
class UserManagementService
{
    private $userRepo;
    private $emailService;
    private $paymentService;
    
    public function __construct(
        UserRepository $userRepo,
        EmailService $emailService,
        PaymentService $paymentService
    ) {
        $this->userRepo = $userRepo;
        $this->emailService = $emailService;
        $this->paymentService = $paymentService;
    }
    
    public function createUser($data)
    {
        // Orchestrate all the services
    }
}

class UserController extends Controller
{
    public function __construct(UserManagementService $userManagement)
    {
        $this->userManagement = $userManagement;
    }
}
```

### 3. Binding Concrete Classes

```php
// PROBLEM: Binding concrete classes makes testing hard
$this->app->bind(UserService::class, UserService::class);

// SOLUTION: Always use interfaces
interface UserServiceInterface
{
    public function createUser($data);
    public function updateUser($id, $data);
}

class UserService implements UserServiceInterface
{
    public function createUser($data)
    {
        // Implementation
    }
    
    public function updateUser($id, $data)
    {
        // Implementation
    }
}

// Bind interface to implementation
$this->app->bind(UserServiceInterface::class, UserService::class);

// Controller depends on interface
class UserController extends Controller
{
    public function __construct(UserServiceInterface $userService)
    {
        $this->userService = $userService;
    }
}
```

## Performance Considerations

### 1. Lazy Loading with Deferred Providers

```php
class ExpensiveServiceProvider extends ServiceProvider
{
    protected $defer = true;
    
    public function register()
    {
        $this->app->singleton(ExpensiveService::class, function ($app) {
            // This only runs when actually needed
            return new ExpensiveService($app->make('heavy.dependency'));
        });
    }
    
    public function provides()
    {
        return [ExpensiveService::class];
    }
}
```

### 2. Singleton for Expensive Objects

```php
public function register()
{
    // Use singleton for expensive objects
    $this->app->singleton(RedisManager::class, function ($app) {
        return new RedisManager(config('database.redis'));
    });
    
    // Don't singleton stateful objects
    $this->app->bind(UserService::class, function ($app) {
        return new UserService($app->make(UserRepository::class));
    });
}
```

### 3. Container Resolution Caching

```php
// In production, Laravel caches container bindings
// Optimize by running:
php artisan config:cache
php artisan route:cache
php artisan view:cache

// Clear caches during development:
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

## Best Practices Summary

### 1. Design Principles

```php
// ✅ DO: Program to interfaces
interface PaymentGatewayInterface
{
    public function charge($amount, $token);
}

// ✅ DO: Use dependency injection
class OrderService
{
    public function __construct(PaymentGatewayInterface $gateway)
    {
        $this->gateway = $gateway;
    }
}

// ❌ DON'T: Depend on concrete classes
class OrderService
{
    public function __construct(StripeGateway $gateway)
    {
        $this->gateway = $gateway;
    }
}
```

### 2. Service Provider Organization

```php
// ✅ DO: Group related bindings
class PaymentServiceProvider extends ServiceProvider
{
    public function register()
    {
        // All payment-related bindings here
        $this->bindGateways();
        $this->bindProcessors();
        $this->bindValidators();
    }
}

// ✅ DO: Use descriptive names
$this->app->bind(PaymentGatewayInterface::class, StripeGateway::class);

// ❌ DON'T: Generic names
$this->app->bind('gateway', 'stripe');
```

### 3. Testing Strategy

```php
// ✅ DO: Mock interfaces in tests
public function test_payment_processing()
{
    $mockGateway = Mockery::mock(PaymentGatewayInterface::class);
    $this->app->instance(PaymentGatewayInterface::class, $mockGateway);
    
    // Test your logic
}

// ✅ DO: Use factory pattern for complex setups
class PaymentServiceFactory
{
    public static function createForTesting()
    {
        return new PaymentService(
            new FakePaymentGateway(),
            new FakeEmailService()
        );
    }
}
```

## Conclusion

Laravel's service container and dependency injection are **the foundation that makes everything else possible**. Master these concepts and you'll:

- Write more maintainable code
- Create easily testable applications  
- Build flexible, swappable components
- Understand how Laravel works under the hood

**Key takeaways:**

1. **IoC (Inversion of Control)** = Principle where external container controls object creation
2. **Service Container** = Laravel's IoC container that builds and manages objects
3. **Dependency Injection** = Pattern that implements IoC by injecting dependencies
4. **Automatic Binding** = Laravel uses reflection to resolve dependencies automatically
5. **Service Providers** = Central hub for configuring how services are bound and booted

Start small—pick one service in your app and extract it to use dependency injection. Then gradually apply these patterns throughout your codebase. Your future self (and your team) will thank you.

---

*The service container might seem complex at first, but once you understand it, you'll see how it makes Laravel applications so elegant and maintainable. What questions do you have about dependency injection or service providers?*